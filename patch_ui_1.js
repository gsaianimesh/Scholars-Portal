const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/meetings/[id]/page.tsx', 'utf8');

const target1 = `                    {!meeting.transcript && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
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
                      </>
                    )}`;

const replace1 = `                    {!meeting.transcript && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          Waiting for Fathom...
                        </div>
                        <Button size="sm" variant="outline" onClick={fetchTranscript} disabled={loading}>
                          {loading ? "Fetching..." : "Fetch Manually"}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setShowManualUpload(!showManualUpload)}>
                          Manual Transcript
                        </Button>
                      </>
                    )}
                  </div>
                  {showManualUpload && !meeting.transcript && (
                    <div className="mt-4 flex flex-col gap-2">
                       <p className="text-sm text-muted-foreground font-medium">Paste Meeting Transcript</p>
                       <textarea 
                          value={manualText}
                          onChange={(e) => setManualText(e.target.value)}
                          className="w-full h-40 p-3 text-sm border rounded-md"
                          placeholder="Paste transcript or minutes here to generate summary & tasks..."
                       />
                       <Button size="sm" onClick={submitManualTranscript} disabled={processingManual}>
                          {processingManual ? "Processing..." : "Generate AI Summary & Tasks"}
                       </Button>
                    </div>
                  )}`;

code = code.replace(target1, replace1);

const target2 = `        <TabsContent value="actions" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {actionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No action items yet</p>
              ) : (
                <div className="space-y-3">
                  {actionItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      <button
                        onClick={() => toggleActionItem(item.id, item.status)}
                        className="mt-0.5"
                      >
                        <CheckCircle
                          className={\`h-5 w-5 \${
                            item.status === "completed"
                              ? "text-green-500 fill-green-500"
                              : "text-gray-300"
                          }\`}
                        />
                      </button>
                      <div className="flex-1">
                        <p className={\`text-sm \${item.status === "completed" ? "line-through text-muted-foreground" : ""}\`}>
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Assigned to: {item.assigned_user?.name || "Unknown"}
                          </span>
                          {item.deadline && (
                            <span className="text-xs text-muted-foreground">
                              · Due {formatDate(item.deadline)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}`;

const replace2 = `        <TabsContent value="actions" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Meeting Tasks</h3>
                {userRole !== "scholar" && (
                  <Button size="sm" onClick={() => setIsAddingTask(!isAddingTask)}>
                    {isAddingTask ? "Cancel" : "Add Task"}
                  </Button>
                )}
              </div>

              {isAddingTask && (
                <form onSubmit={handleAddTask} className="space-y-3 border p-4 rounded-md bg-muted/20">
                  <div className="space-y-1">
                    <Label htmlFor="taskTitle">Task Title</Label>
                    <Input id="taskTitle" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required placeholder="Quick description..." />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="taskDesc">Details (Optional)</Label>
                    <textarea id="taskDesc" className="w-full text-sm p-2 border rounded-md" value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="taskAssignee">Assign To</Label>
                      <select id="taskAssignee" className="w-full text-sm p-2 border rounded-md" value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} required>
                        <option value="" disabled>Select scholar...</option>
                        {participants.filter(p => p.user?.role === "scholar").map(p => (
                           <option key={p.user_id} value={p.user_id}>{p.user?.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="taskDeadline">Due Date (Optional)</Label>
                      <Input id="taskDeadline" type="date" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" size="sm">Create Task</Button>
                </form>
              )}

              {actionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks have been created yet.</p>
              ) : (
                <div className="space-y-3">
                  {actionItems.map((item) => {
                    const assigneeName = item.task_assignments?.[0]?.scholar?.user?.name || "Unknown";
                    return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg border group"
                    >
                      <button
                        onClick={() => toggleActionItem(item.id, item.status)}
                        className="mt-0.5"
                      >
                        <CheckCircle
                          className={\`h-5 w-5 \${
                            item.status === "completed"
                              ? "text-green-500 fill-green-500"
                              : "text-gray-300"
                          }\`}
                        />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                           <p className={\`text-sm font-medium \${item.status === "completed" ? "line-through text-muted-foreground" : ""}\`}>
                             {item.title}
                           </p>
                           {item.is_auto_generated && (
                             <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Auto-generated</span>
                           )}
                        </div>
                        {item.description && (
                           <p className={\`text-xs mt-1 \${item.status === "completed" ? "text-muted-foreground/50" : "text-muted-foreground"}\`}>
                              {item.description}
                           </p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">
                              Assigned to: {assigneeName}
                            </span>
                            {item.deadline && (
                              <span className="text-xs text-muted-foreground">
                                · Due {formatDate(item.deadline)}
                              </span>
                            )}
                          </div>
                          {userRole !== "scholar" && (
                            <button 
                              onClick={() => removeActionItem(item.id)}
                              className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}`;

code = code.replace(target2, replace2);

fs.writeFileSync('src/app/dashboard/meetings/[id]/page.tsx', code);
