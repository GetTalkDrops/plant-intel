# Backend Integration Plan
## Connecting Frontend UI to ML Service Backend

### Overview
This document outlines the step-by-step plan to integrate the existing FastAPI ML service (`plant-intel-mvp/ml-service`) with the new Next.js 16 frontend (`plantintel/frontend`).

---

## Current State

### ✅ What We Have

**Frontend (Complete):**
- Dashboard with drag-drop CSV upload
- Mapping Library (CRUD for mapping profiles)
- Analysis Results page with AI chat
- Admin Portal with 39-variable config editor
- All pages use mock data matching backend structure

**Backend (Exists in old project):**
- FastAPI service with 4 analyzers (Cost, Equipment, Quality, Efficiency)
- Auto-Analysis Orchestrator that coordinates all analyzers
- Supabase database connection
- CSV upload and processing
- Baseline tracking, trend detection, correlation analysis
- AI narrative generation

---

## Integration Steps

### Phase 1: Setup & Environment (Week 1)

#### 1.1 Move ML Service to New Project
```bash
# Copy the ml-service directory
cp -r ~/plant-intel-mvp/ml-service ~/plantintel/backend

# Update .env configuration
cd ~/plantintel/backend
cp .env.example .env
```

**Update `.env` with:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
CLERK_SECRET_KEY=your_clerk_key
OPENAI_API_KEY=your_openai_key  # For AI chat
```

#### 1.2 Update CORS Settings
In `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",  # Updated port
        "https://your-production-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 1.3 Install Dependencies
```bash
cd ~/plantintel/backend
pip install -r requirements.txt

# Add new dependencies for AI chat
pip install openai anthropic
pip freeze > requirements.txt
```

---

### Phase 2: Database Schema (Week 1-2)

#### 2.1 Create Supabase Tables

**Table: `mapping_profiles`**
```sql
CREATE TABLE mapping_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  erp_system TEXT,
  data_granularity TEXT CHECK (data_granularity IN ('header', 'operation')),
  aggregation_strategy TEXT,
  mappings JSONB NOT NULL,  -- Array of PropertyMapping objects
  config_variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mapping_profiles_user_id ON mapping_profiles(user_id);
CREATE INDEX idx_mapping_profiles_active ON mapping_profiles(is_active);
```

**Table: `analyses`**
```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  facility_id INTEGER NOT NULL,
  batch_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  row_count INTEGER,
  status TEXT CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  mapping_profile_ids TEXT[] DEFAULT '{}',
  data_tier INTEGER,
  analyzers_run TEXT[] DEFAULT '{}',
  results JSONB,  -- Full analysis results from orchestrator
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_batch_id ON analyses(batch_id);
CREATE INDEX idx_analyses_status ON analyses(status);
```

**Table: `customers` (Admin)**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  contact_name TEXT,
  phone TEXT,
  address TEXT,
  plan TEXT CHECK (plan IN ('pilot', 'subscription')),
  status TEXT CHECK (status IN ('trial', 'active', 'inactive')) DEFAULT 'trial',
  notes TEXT,
  facility_ids INTEGER[] DEFAULT '{}',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
```

**Table: `analyzer_configs` (Admin - 39 variables)**
```sql
CREATE TABLE analyzer_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  facility_id INTEGER NOT NULL,
  config JSONB NOT NULL,  -- Full AnalyzerConfig object from frontend
  preset_type TEXT,  -- 'conservative', 'balanced', 'aggressive', 'custom'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, facility_id)
);

CREATE INDEX idx_analyzer_configs_customer ON analyzer_configs(customer_id);
```

**Table: `chat_messages` (AI Chat)**
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_analysis ON chat_messages(analysis_id);
```

#### 2.2 RLS Policies
```sql
-- Enable RLS
ALTER TABLE mapping_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profiles" ON mapping_profiles
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own profiles" ON mapping_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Similar policies for analyses and chat_messages
```

---

### Phase 3: API Endpoints (Week 2)

#### 3.1 Create Next.js API Routes

**File: `frontend/app/api/upload/route.ts`**
```typescript
import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const profileIds = JSON.parse(formData.get("profileIds") as string);

  // Forward to FastAPI ML service
  const mlFormData = new FormData();
  mlFormData.append("file", file);
  mlFormData.append("user_email", userId);
  mlFormData.append("profile_ids", JSON.stringify(profileIds));

  const response = await fetch("http://localhost:8000/upload/csv", {
    method: "POST",
    body: mlFormData,
  });

  const result = await response.json();
  return NextResponse.json(result);
}
```

**File: `frontend/app/api/analysis/[id]/route.ts`**
```typescript
import { auth } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}
```

**File: `frontend/app/api/chat/route.ts`**
```typescript
import { OpenAI } from "openai";
import { auth } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { analysisId, message } = await request.json();

  const supabase = createClient();

  // Get analysis context
  const { data: analysis } = await supabase
    .from("analyses")
    .select("results")
    .eq("id", analysisId)
    .single();

  // Get chat history
  const { data: history } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("created_at", { ascending: true });

  // Build context for GPT
  const systemPrompt = `You are a manufacturing intelligence assistant analyzing production data.

Analysis Results:
${JSON.stringify(analysis?.results, null, 2)}

Answer user questions about patterns, savings opportunities, suppliers, equipment, and work orders.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((h: any) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
    stream: true,
  });

  // Store messages
  await supabase.from("chat_messages").insert([
    { analysis_id: analysisId, role: "user", content: message },
  ]);

  // Stream response back to frontend
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of completion) {
        const text = chunk.choices[0]?.delta?.content || "";
        controller.enqueue(text);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain" },
  });
}
```

#### 3.2 Update FastAPI Endpoints

**Add to `backend/main.py`:**
```python
@app.post("/upload/process")
async def upload_and_analyze(
    file: UploadFile = File(...),
    user_email: str = Form(...),
    profile_ids: str = Form(...)
):
    """Upload CSV, apply mappings, run analyzers, store results"""
    try:
        # 1. Upload to Supabase Storage
        storage_path = await upload_to_storage(file, user_email)

        # 2. Parse CSV and apply mapping profiles
        df = await parse_and_map_csv(file, json.loads(profile_ids))

        # 3. Insert work orders to database
        batch_id = str(uuid.uuid4())
        facility_id = get_facility_id(user_email)
        rows_inserted = insert_work_orders(df, facility_id, batch_id)

        # 4. Run orchestrator
        analysis_result = orchestrator.analyze(
            facility_id=facility_id,
            batch_id=batch_id,
            csv_headers=df.columns.tolist()
        )

        # 5. Store analysis result in analyses table
        analysis_id = store_analysis_result(
            user_id=user_email,
            facility_id=facility_id,
            batch_id=batch_id,
            result=analysis_result,
            file_info={
                'name': file.filename,
                'size': file.size,
                'rows': len(df)
            }
        )

        return {
            'success': True,
            'analysis_id': analysis_id,
            'rows_processed': rows_inserted
        }

    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={'success': False, 'error': str(e)}
        )
```

---

### Phase 4: Frontend Updates (Week 2-3)

#### 4.1 Replace Mock Data with API Calls

**Update `frontend/app/dashboard/page.tsx`:**
```typescript
const handleUpload = async () => {
  if (!uploadedFile || selectedProfiles.size === 0) return;

  setIsUploading(true);

  try {
    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("profileIds", JSON.stringify(Array.from(selectedProfiles)));

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      toast.success("Analysis complete!");
      router.push(`/dashboard/analysis/${result.analysis_id}`);
    } else {
      toast.error(result.error || "Upload failed");
    }
  } catch (error) {
    toast.error("Upload failed");
  } finally {
    setIsUploading(false);
    setIsSheetOpen(false);
  }
};
```

**Update `frontend/app/dashboard/analysis/[id]/page.tsx`:**
```typescript
export default function AnalysisDetailPage() {
  const params = useParams();
  const analysisId = params.id as string;
  const [analysis, setAnalysis] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadAnalysis() {
      const response = await fetch(`/api/analysis/${analysisId}`);
      const data = await response.json();
      setAnalysis(data);
      setLoading(false);
    }
    loadAnalysis();
  }, [analysisId]);

  if (loading) return <LoadingSpinner />;
  if (!analysis) return <NotFound />;

  // Use analysis.results instead of mockAnalysis
  return (
    // ... render with real data
  );
}
```

#### 4.2 Update AI Chat to Use Streaming

**Update `frontend/components/analysis/ai-chat.tsx`:**
```typescript
const handleSendMessage = async () => {
  if (!input.trim() || isLoading) return;

  const userMessage: Message = {
    id: `user-${Date.now()}`,
    role: "user",
    content: input.trim(),
    timestamp: new Date(),
  };

  setMessages((prev) => [...prev, userMessage]);
  setInput("");
  setIsLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysisId,
        message: userMessage.content,
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    let assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const text = decoder.decode(value);
      assistantMessage.content += text;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: assistantMessage.content }
            : m
        )
      );
    }
  } catch (error) {
    toast.error("Failed to send message");
  } finally {
    setIsLoading(false);
  }
};
```

---

### Phase 5: Admin Portal Backend (Week 3)

#### 5.1 Add Admin API Routes

**File: `frontend/app/api/admin/customers/route.ts`**
```typescript
import { auth } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { userId, sessionClaims } = auth();

  // Check admin role
  if (sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { userId, sessionClaims } = auth();

  if (sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customerData = await request.json();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert(customerData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

**File: `frontend/app/api/admin/config/route.ts`**
```typescript
export async function POST(request: NextRequest) {
  const { userId, sessionClaims } = auth();

  if (sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { customerId, facilityId, config, presetType } = await request.json();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("analyzer_configs")
    .upsert({
      customer_id: customerId,
      facility_id: facilityId,
      config,
      preset_type: presetType,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

---

### Phase 6: Testing & Deployment (Week 4)

#### 6.1 Local Testing Checklist

- [ ] Backend service runs on `http://localhost:8000`
- [ ] Frontend runs on `http://localhost:3001`
- [ ] CSV upload works end-to-end
- [ ] All 4 analyzers run correctly
- [ ] Analysis results display properly
- [ ] AI chat responds with context
- [ ] Mapping profiles CRUD works
- [ ] Admin portal accessible (with admin role)
- [ ] Config editor saves to database

#### 6.2 Deploy Backend
```bash
# Option 1: Railway
railway login
railway init
railway up

# Option 2: Render
# Create new Web Service
# Build: pip install -r requirements.txt
# Start: uvicorn main:app --host 0.0.0.0 --port $PORT

# Option 3: Google Cloud Run
gcloud run deploy ml-service --source .
```

#### 6.3 Deploy Frontend (Vercel)
```bash
# Already connected to Vercel
vercel --prod

# Set environment variables in Vercel dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - CLERK_SECRET_KEY
# - ML_SERVICE_URL (backend URL from Railway/Render)
# - OPENAI_API_KEY
```

---

## API Contract Summary

### Frontend → Backend

**1. Upload CSV**
```
POST /api/upload
Body: FormData {
  file: File,
  profileIds: string[] (JSON)
}
Response: {
  success: boolean,
  analysis_id: string,
  rows_processed: number
}
```

**2. Get Analysis**
```
GET /api/analysis/:id
Response: Analysis object with results from orchestrator
```

**3. Chat with AI**
```
POST /api/chat
Body: {
  analysisId: string,
  message: string
}
Response: Stream of text
```

**4. Mapping Profiles CRUD**
```
GET /api/profiles
POST /api/profiles
PUT /api/profiles/:id
DELETE /api/profiles/:id
```

**5. Admin APIs**
```
GET /api/admin/customers
POST /api/admin/customers
POST /api/admin/config
```

---

## Configuration Mapping

### Frontend Config (39 variables) → Backend Analyzers

The 39 variables in `AnalyzerConfigEditor` map directly to the `config` parameter in:
- `CostAnalyzer.predict_cost_variance(facility_id, batch_id, config)`
- `EquipmentPredictor.predict_failures(facility_id, batch_id, config)`
- `QualityAnalyzer.analyze_quality_patterns(facility_id, batch_id, config)`
- `EfficiencyAnalyzer.analyze_efficiency_patterns(facility_id, batch_id, config)`

Stored in `analyzer_configs` table, retrieved per-customer per-facility.

---

## Success Metrics

- [ ] Upload → Results: < 30 seconds for 200 rows
- [ ] AI chat response: < 3 seconds
- [ ] All analyzers run without errors
- [ ] Admin can configure all 39 variables
- [ ] Users can save/reuse mapping profiles
- [ ] Analysis history persisted in database

---

## Next Steps After Integration

1. **Performance Optimization**
   - Cache analysis results
   - Parallel analyzer execution
   - Database query optimization

2. **Enhanced Features**
   - Email notifications for completed analyses
   - PDF export of insights
   - Scheduled analyses
   - Multi-facility comparison

3. **Production Hardening**
   - Rate limiting
   - Error monitoring (Sentry)
   - Logging (Datadog/CloudWatch)
   - Backup strategy
