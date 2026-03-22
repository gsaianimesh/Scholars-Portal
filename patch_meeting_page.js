const fs = require('fs');
const file = 'src/app/dashboard/meetings/[id]/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add states
const statesBlock = `  const [rescheduling, setRescheduling] = useState(false);
  const [fathomError, setFathomError] = useState("");
  const [autoTasks, setAutoTasks] = useState<any[]>([]);`;

const newStatesBlock = `  const [rescheduling, setRescheduling] = useState(false);
  const [fathomError, setFathomError] = useState("");
  const [autoTasks, setAutoTasks] = useState<any[]>([]);
  
  const [showManualUpload, setShowManualUpload] = useState(false);
  const [manualText, setManualText] = useState("");
  const [processingManual, setProcessingManual] = useState(false);

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");`;

code = code.replace(statesBlock, newStatesBlock);

// 2. Add methods submitManualTranscript and handleAddTask
// We'll insert methods after fetchTranscript function

const fetchTranscriptBlock = `  async function fetchTranscript() {
    setLoading(true);
    setFathomError("");
    try {
      const res = await fetch(\`/api/meetings/\${params.id}/transcript\`);
      if (res.ok) {
        const data = await res.json();
        if (data.autoCreatedTasks && data.autoCreatedTasks.length > 0) {
          setAutoTasks(data.autoCreatedTasks);
        }
        loadMeeting();
      } else {
        const data = await res.json();
        setFathomError(data.error || "Failed to fetch transcript");
      }
    } catch (err: any) {
      setFathomError(err.message || "Failed to fetch transcript");
    } finally {
      setLoading(false);
    }
  }`;

const newMethods = `${fetchTranscriptBlock}

  async function submitManualTranscript() {
    if (!manualText.trim()) return;
    setProcessingManual(true);
    setFathomError("");
    try {
      const res = await fetch(\`/api/meetings/\${params.id}/transcript\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualTranscript: manualText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.autoCreatedTasks && data.autoCreatedTasks.length > 0) {
          setAutoTasks(data.autoCreatedTasks);
        }
        setShowManualUpload(false);
        loadMeeting();
      } else {
        const data = await res.json();
        setFathomError(data.error || "Failed to process manual transcript");
      }
    } catch (err: any) {
      setFathomError(err.message || "Failed to process transcript");
    } finally {
      setProcessingManual(false);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskAssignee) return;
    
    // find scholar ID 
    const { data: scholar } = await supabase.from("scholars").select("id").eq("user_id", newTaskAssignee).maybeSingle();
    let scholarIds = [];
    if (scholar) {
      scholarIds.push(scholar.id);
    }
    
    if (scholarIds.length === 0) {
      alert("Invalid assignee");
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          scholarIds,
          meetingId: params.id,
          deadline: newTaskDeadline || undefined,
        }),
      });
      if (res.ok) {
        setIsAddingTask(false);
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskAssignee("");
        setNewTaskDeadline("");
        loadMeeting();
      } else {
         alert("Failed to create task");
      }
    } catch (e) {
      alert("Error adding task");
    }
  }`;

code = code.replace(fetchTranscriptBlock, newMethods);


// 3. Modifying the Details Tab logic to add Manual Fallback button
const waitingFathomBlock = `                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          Waiting for Fathom to process transcript & summary...
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={fetchTranscript}
                          disabled={loading}
                        >
                          {loading ? "Fetching..." : "Fetch Manually"}
                        </Button>
                      </>`;

const manualUploadUI = `                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          Waiting for Fathom...
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={fetchTranscript}
                          disabled={loading}
                        >
                          {loading ? "Fetching..." : "Fetch Manually"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setShowManualUpload(!showManualUpload)}
                        >
                          Provide Text Log
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {fathomError && (
                    <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">
                      {fathomError}
                    </div>
                  )}

                  {showManualUpload && !meeting.transcript && (
                    <div className="mt-4 flex flex-col gap-2">
                       <p className="text-sm text-muted-foreground font-medium">Paste Meeting Transcript</p>
                       <textarea 
                          value={manualText}
                          onChange={(e) => setManualText(e.target.value)}
                          className="w-full h-40 p-3 text-sm border rounded-md"
                          placeholder="Paste a custom transcript or minutes here to generate summary & tasks..."
                       />
                       <Button size="sm" onClick={submitManualTranscript} disabled={processingManual}>
                          {processingManual ? "Processing..." : "Generate AI Summary & Tasks"}
                       </Button>
                    </div>
                  )}
                  <div className="hidden">`; // to trick the original bracket matching, nah wait better fix it precisely

fs.writeFileSync(file, code);
