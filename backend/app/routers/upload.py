"""
CSV Upload Endpoints
"""

import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Request, HTTPException
from fastapi.responses import JSONResponse

from app.middleware import require_auth, audit_logger
from app.handlers.csv_upload_service import CsvUploadService

logger = logging.getLogger(__name__)

router = APIRouter()
csv_service = CsvUploadService()


@router.post("/upload/csv")
@require_auth
async def upload_csv(
    request: Request,
    user_context: dict,
    file: UploadFile = File(...),
    confirmed_mapping: Optional[str] = Form(None)
):
    """
    Upload CSV file with automatic column mapping

    Multi-tenant: Uses org_id from JWT token
    """
    try:
        # Extract user context
        org_id = user_context["org_id"]
        user_id = user_context["user_id"]
        trace_id = getattr(request.state, "trace_id", None)

        # Read file content
        content = await file.read()
        content_str = content.decode('utf-8')

        # Parse confirmed mapping if provided
        mapping_dict = None
        if confirmed_mapping:
            import json
            try:
                mapping_dict = json.loads(confirmed_mapping)
            except Exception as e:
                logger.warning(f"Failed to parse confirmed_mapping: {str(e)}")

        # Process upload with multi-tenant context
        result = csv_service.process_upload(
            file_content=content_str,
            org_id=org_id,  # CRITICAL: From JWT only
            user_id=user_id,
            filename=file.filename,
            confirmed_mapping=mapping_dict
        )

        if result.success:
            # Log to audit trail
            await audit_logger.log_csv_upload(
                user_id=user_id,
                org_id=org_id,
                batch_id=result.batch_id,
                filename=file.filename,
                row_count=result.rows_inserted,
                file_size_bytes=len(content),
                trace_id=trace_id,
                ip_address=request.client.host if request.client else None,
            )

            return JSONResponse(
                status_code=200,
                content={
                    'success': True,
                    'message': f'Successfully uploaded {result.rows_inserted} work orders',
                    'data': result.to_dict()
                }
            )
        else:
            return JSONResponse(
                status_code=400,
                content={
                    'success': False,
                    'error': result.error,
                    'technical_details': result.technical_details
                }
            )

    except Exception as e:
        logger.error(f"Upload failed: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Server error: {str(e)}'
            }
        )


@router.post("/upload/csv/analyze")
@require_auth
async def analyze_csv(
    user_context: dict,
    file: UploadFile = File(...)
):
    """
    Analyze CSV and return mapping suggestions without uploading

    No org_id needed for this read-only operation
    """
    try:
        content = await file.read()
        content_str = content.decode('utf-8')

        result = csv_service.get_mapping_suggestions(content_str)

        if result['success']:
            return JSONResponse(status_code=200, content=result)
        else:
            return JSONResponse(status_code=400, content=result)

    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={'success': False, 'error': f'Analysis failed: {str(e)}'}
        )
