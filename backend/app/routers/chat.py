"""
AI Chat Endpoints

Provides AI-powered chat functionality using Anthropic Claude.
This is the "moat" feature that enables the $50k savings guarantee.
"""

import logging
import os
import json
from typing import Optional
from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from anthropic import Anthropic
from supabase import create_client, Client

from app.middleware import get_current_user, audit_logger
from app.services.usage_tracking import (
    track_usage_event,
    check_usage_limit,
    UsageEventType
)
from app.utils.error_tracking import track_error, track_ai_error, ErrorCategory, ErrorSeverity

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Anthropic client
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_KEY", "")
)


class ChatMessage(BaseModel):
    """Chat message model"""
    message: str
    analysis_id: Optional[str] = None
    context: Optional[dict] = None


@router.post("/chat")
async def send_chat_message(
    request: Request,
    chat_message: ChatMessage,
    user: dict = Depends(get_current_user)
):
    """
    Send a chat message and get AI response using Anthropic Claude

    Multi-tenant: Uses org_id from JWT token
    Context includes analysis results for relevant Q&A

    This is the "moat" feature - AI-powered insights on manufacturing data
    """
    try:
        org_id = user["org_id"]
        user_id = user["user_id"]
        message_id = str(uuid4())

        logger.info(f"Chat message from user {user_id}, org {org_id}")

        # ========================================================================
        # Step 0: Check usage limits
        # ========================================================================
        within_limit, current, limit = await check_usage_limit(
            org_id=org_id,
            event_type=UsageEventType.CHAT_MESSAGE,
            tier="pilot"  # TODO: Get from customers table
        )

        if not within_limit:
            logger.warning(f"Chat limit exceeded for org {org_id}: {current}/{limit}")
            raise HTTPException(
                status_code=429,
                detail=f"Chat message limit exceeded ({current}/{limit} this month). Please upgrade your plan."
            )

        # ========================================================================
        # Step 1: Get analysis context if provided
        # ========================================================================
        context_text = ""
        analysis_data = None

        if chat_message.analysis_id:
            try:
                # Fetch analysis from database
                analysis_response = supabase.table("analyses") \
                    .select("*") \
                    .eq("id", chat_message.analysis_id) \
                    .eq("org_id", org_id) \
                    .single() \
                    .execute()

                if analysis_response.data:
                    analysis_data = analysis_response.data
                    results = analysis_data.get("results", {})

                    # Build context from analysis results
                    context_parts = []
                    context_parts.append(f"Analysis Summary: {analysis_data.get('summary', 'N/A')}")
                    context_parts.append(f"Data Tier: {analysis_data.get('data_tier', 'N/A')}")
                    context_parts.append(f"\nAnalysis Results:")
                    context_parts.append(json.dumps(results, indent=2))

                    context_text = "\n".join(context_parts)

                    logger.info(f"Added analysis context for analysis_id: {chat_message.analysis_id}")

            except Exception as e:
                logger.warning(f"Failed to fetch analysis context: {str(e)}")
                # Continue without context

        # ========================================================================
        # Step 2: Build system prompt (manufacturing expert persona)
        # ========================================================================
        system_prompt = """You are an expert manufacturing analyst specializing in production optimization and cost savings.

Your role is to help manufacturing companies identify savings opportunities and improve operational efficiency.

Key guidelines:
- Be concise and actionable in your responses (2-3 paragraphs max)
- Focus on the $50k savings guarantee opportunity
- Provide specific, data-driven recommendations
- Reference the analysis results when available
- Use manufacturing terminology appropriately
- Prioritize cost savings, quality improvements, and efficiency gains

When analyzing data:
1. Identify the top 3 savings opportunities
2. Quantify potential impact when possible
3. Provide actionable next steps
4. Consider both quick wins and long-term improvements"""

        # ========================================================================
        # Step 3: Call Anthropic Claude API
        # ========================================================================
        messages = []

        # Add context as a system message if available
        if context_text:
            messages.append({
                "role": "user",
                "content": f"Here is the analysis data for context:\n\n{context_text}\n\nNow, please answer my question based on this data."
            })
            messages.append({
                "role": "assistant",
                "content": "I've reviewed the analysis data. I'm ready to answer your questions about production optimization and cost savings opportunities."
            })

        # Add user message
        messages.append({
            "role": "user",
            "content": chat_message.message
        })

        logger.info(f"Calling Claude API with {len(messages)} messages")

        # Call Claude API
        try:
            response = anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",  # Latest Claude model
                max_tokens=1024,
                system=system_prompt,
                messages=messages
            )

            ai_response = response.content[0].text

            logger.info(f"Received response from Claude: {len(ai_response)} characters")

        except Exception as ai_error:
            # Track AI service error
            error_id = track_ai_error(
                ai_error,
                context={
                    "model": "claude-3-5-sonnet-20241022",
                    "message_id": message_id,
                    "has_context": bool(context_text)
                },
                user_id=user_id,
                org_id=org_id
            )
            logger.error(f"Claude API call failed (error_id: {error_id}): {str(ai_error)}")
            raise HTTPException(
                status_code=503,
                detail=f"AI service temporarily unavailable. Error ID: {error_id}"
            )

        # ========================================================================
        # Step 3.5: Track AI token usage
        # ========================================================================
        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens

        logger.info(f"Token usage - Input: {input_tokens}, Output: {output_tokens}")

        # Track input tokens
        await track_usage_event(
            org_id=org_id,
            event_type=UsageEventType.AI_TOKENS_INPUT,
            quantity=input_tokens,
            metadata={
                "model": "claude-3-5-sonnet-20241022",
                "message_id": message_id,
                "has_context": bool(context_text)
            }
        )

        # Track output tokens
        await track_usage_event(
            org_id=org_id,
            event_type=UsageEventType.AI_TOKENS_OUTPUT,
            quantity=output_tokens,
            metadata={
                "model": "claude-3-5-sonnet-20241022",
                "message_id": message_id
            }
        )

        # Track chat message count
        await track_usage_event(
            org_id=org_id,
            event_type=UsageEventType.CHAT_MESSAGE,
            quantity=1,
            metadata={
                "message_id": message_id,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "has_analysis_context": bool(chat_message.analysis_id)
            }
        )

        # ========================================================================
        # Step 4: Save to database
        # ========================================================================
        chat_record = {
            "id": message_id,
            "org_id": org_id,
            "user_id": user_id,
            "message": chat_message.message,
            "response": ai_response,
            "analysis_id": chat_message.analysis_id,
            "created_at": datetime.utcnow().isoformat(),
        }

        supabase.table("chat_messages").insert(chat_record).execute()

        logger.info(f"Saved chat message to database: {message_id}")

        # ========================================================================
        # Step 5: Audit log
        # ========================================================================
        await audit_logger.log(
            action="chat.message_sent",
            user_id=user_id,
            org_id=org_id,
            resource_type="chat_message",
            resource_id=message_id,
            details={
                "message_length": len(chat_message.message),
                "response_length": len(ai_response),
                "has_analysis_context": bool(chat_message.analysis_id)
            }
        )

        # ========================================================================
        # Step 6: Return response
        # ========================================================================
        return {
            "id": message_id,
            "message": chat_message.message,
            "response": ai_response,
            "analysis_id": chat_message.analysis_id,
            "created_at": chat_record["created_at"]
        }

    except HTTPException:
        # Re-raise HTTP exceptions (like 429, 503)
        raise
    except Exception as e:
        # Track unexpected errors
        error_id = track_error(
            e,
            category=ErrorCategory.BUSINESS_LOGIC,
            severity=ErrorSeverity.HIGH,
            context={"endpoint": "chat", "analysis_id": chat_message.analysis_id},
            user_id=user.get("user_id"),
            org_id=user.get("org_id")
        )
        logger.error(f"Chat failed (error_id: {error_id}): {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f'Chat failed. Error ID: {error_id}'
        )


@router.get("/chat/history/{analysis_id}")
async def get_chat_history(
    analysis_id: str,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """
    Get chat history for an analysis

    Multi-tenant: Automatically filtered by org_id via RLS
    """
    try:
        org_id = user["org_id"]

        logger.info(f"Fetching chat history for analysis {analysis_id}, org {org_id}")

        # Query chat messages filtered by org_id and analysis_id
        response = supabase.table("chat_messages") \
            .select("*") \
            .eq("org_id", org_id) \
            .eq("analysis_id", analysis_id) \
            .order("created_at", desc=False) \
            .limit(limit) \
            .execute()

        messages = response.data or []

        logger.info(f"Found {len(messages)} chat messages for analysis {analysis_id}")

        return {
            "analysis_id": analysis_id,
            "messages": messages,
            "count": len(messages)
        }

    except Exception as e:
        logger.error(f"Failed to get chat history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f'Failed to get chat history: {str(e)}'
        )


@router.get("/chat/history")
async def get_all_chat_history(
    limit: int = 100,
    user: dict = Depends(get_current_user)
):
    """
    Get all chat history for the organization

    Multi-tenant: Automatically filtered by org_id via RLS
    """
    try:
        org_id = user["org_id"]

        logger.info(f"Fetching all chat history for org {org_id}")

        # Query all chat messages for this organization
        response = supabase.table("chat_messages") \
            .select("*") \
            .eq("org_id", org_id) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()

        messages = response.data or []

        logger.info(f"Found {len(messages)} total chat messages for org {org_id}")

        return {
            "messages": messages,
            "count": len(messages)
        }

    except Exception as e:
        logger.error(f"Failed to get chat history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f'Failed to get chat history: {str(e)}'
        )
