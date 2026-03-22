const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/meetings/[id]/page.tsx', 'utf8');

const insertion = \`
  async function submitManualTranscript() {
    if (!manualText.trim()) return;
    setProcessingManual(true);
    setFathomError("");
    try {
      const res = await fetch(\\\`/api/meetings/\${params.id}/transcript\\\`, {
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
        setManualText(""); // Clear after success
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
  }
\`;

code = code.replace('  async function deleteAutoTask', insertion + '\\n  async function deleteAutoTask');
fs.writeFileSync('src/app/dashboard/meetings/[id]/page.tsx', code);
