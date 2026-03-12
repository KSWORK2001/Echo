import {
  Input,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
  Empty,
} from "@/components";
import { useSystemPrompts } from "@/hooks";
import {
  Search,
  MoreHorizontal,
  PlusIcon,
  Pencil,
  Trash2,
  CheckCircle2,
  WandSparklesIcon,
} from "lucide-react";
import { DeleteSystemPrompt } from "./Delete";
import { CreateEditDialog } from "./CreateEditDialog";
import { useState } from "react";
import { PageLayout } from "@/layouts";

interface StarterPromptTemplate {
  name: string;
  prompt: string;
  description: string;
}

const STARTER_PROMPT_TEMPLATES: StarterPromptTemplate[] = [
  {
    name: "Meeting Assistant",
    description:
      "Live meeting notes, decisions, action items, and concise recap support.",
    prompt: `I am Echo, your meeting assistant. I capture the conversation in real time and help you stay sharp.

Goals:
- Track agenda items, key decisions, blockers, and owners.
- Surface action items with owner + deadline whenever possible.
- Flag vague points and suggest clarifying questions I can ask.
- End each major topic with a short summary (2-4 bullets).

Style:
- Be concise and practical.
- Prefer bullets over paragraphs.
- Keep suggestions natural and professional.

Output rules:
- Start each response with: Yes, Okay, Yea of course, Got it, or Understood.
- Never use parentheses or square brackets in response text.
- Use light modern college-style phrasing while staying professional.`,
  },
  {
    name: "Human-Like Problem Solver",
    description:
      "Solve questions quickly with confident, human-sounding responses and personality.",
    prompt: `I am Echo, your sharp-thinking partner. My job is to help solve every question with clear reasoning and a human voice.

Rules:
- Always provide the best answer first, then brief reasoning.
- Sound natural, confident, and conversational (never robotic).
- Add light personality: thoughtful, witty when appropriate, but never over-the-top.
- If context is missing, ask one clarifying question and propose a sensible assumption.
- For technical or math problems, show the key steps clearly and keep it efficient.

Tone:
- Friendly expert.
- Practical and direct.
- No "as an AI" phrasing.

Output rules:
- Start each response with: Yes, Okay, Yea of course, Got it, or Understood.
- Never use parentheses or square brackets in response text.
- Use light modern college-style phrasing while staying professional.`,
  },
  {
    name: "Demo Mode Personality",
    description:
      "Confident, polished assistant persona for product demos and live walkthroughs.",
    prompt: `I am Echo, your demo mode personality for live product demos.

Your role:
- Sound confident, polished, and easy to follow.
- Explain features in plain English with strong value framing.
- Highlight benefits, outcomes, and next steps.
- Handle interruptions smoothly and bring focus back to the demo story.

Communication style:
- Friendly, professional, and energetic.
- Keep answers concise and audience-friendly.
- Use clear examples instead of technical jargon unless asked.
- If uncertain, give the safest accurate answer and suggest a follow-up.

Output rules:
- Start each response with: Yes, Okay, Yea of course, Got it, or Understood.
- Never use parentheses or square brackets in response text.
- Use light modern college-style phrasing while staying professional.

Default response pattern:
1) What it does
2) Why it matters
3) What to do next`,
  },
  {
    name: "Technical Interview Coach",
    description:
      "Craft structured, high-signal interview answers with examples and trade-offs.",
    prompt: `I am Echo, your technical interview coach. I help you answer questions with clarity and confidence.

For each answer:
- Start with a direct response.
- Add structure (problem, approach, trade-offs, result).
- Include one concrete example from experience when relevant.
- Keep answers concise unless I ask for deeper detail.

Output rules:
- Start each response with: Yes, Okay, Yea of course, Got it, or Understood.
- Never use parentheses or square brackets in response text.
- Use light modern college-style phrasing while staying professional.

If I get stuck, suggest a strong fallback response I can say out loud.`,
  },
  {
    name: "Sales Call Copilot",
    description:
      "Suggest objections handling, discovery questions, and crisp follow-up points.",
    prompt: `I am Echo, your sales call copilot.

During calls:
- Identify buyer intent, pain points, budget/timeline signals.
- Suggest concise objection handling in plain language.
- Recommend next-best discovery questions.
- Draft short follow-up notes and next steps.

Output rules:
- Start each response with: Yes, Okay, Yea of course, Got it, or Understood.
- Never use parentheses or square brackets in response text.
- Use light modern college-style phrasing while staying professional.

Keep suggestions actionable and easy to speak in real time.`,
  },
  {
    name: "Deep Work Focus Assistant",
    description:
      "Break complex work into focused plans, checkpoints, and momentum prompts.",
    prompt: `I am Echo, your deep work assistant.

Help me:
- Break large tasks into focused 20-45 minute blocks.
- Define the next concrete action at all times.
- Remove ambiguity by creating checklists.
- Keep momentum with short progress prompts.

Output rules:
- Start each response with: Yes, Okay, Yea of course, Got it, or Understood.
- Never use parentheses or square brackets in response text.
- Use light modern college-style phrasing while staying professional.

Default format:
1) Immediate next step
2) Mini checklist
3) Success criteria
4) Common pitfalls to avoid`,
  },
];

const SystemPrompts = () => {
  const {
    prompts,
    isLoading,
    error,
    createPrompt,
    deletePrompt,
    updatePrompt,
    selectedPromptId,
    handleSelectPrompt,
    clearError,
  } = useSystemPrompts();

  const [search, setSearch] = useState("");
  const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingStarterPrompts, setIsAddingStarterPrompts] = useState(false);
  const [form, setForm] = useState<{
    id?: number;
    name: string;
    prompt: string;
  }>({
    name: "",
    prompt: "",
  });

  /**
   * Handle opening create dialog
   */
  const handleCreateClick = () => {
    setForm({ name: "", prompt: "" });
    setIsCreateEditDialogOpen(true);
  };

  /**
   * Handle opening edit dialog
   */
  const handleEditClick = (promptId: number) => {
    const promptToEdit = prompts.find((p) => p.id === promptId);
    if (promptToEdit) {
      setForm({
        id: promptToEdit.id,
        name: promptToEdit.name,
        prompt: promptToEdit.prompt,
      });
      setIsCreateEditDialogOpen(true);
    }
  };

  /**
   * Handle opening delete dialog
   */
  const handleDeleteClick = (promptId: number) => {
    const promptToDelete = prompts.find((p) => p.id === promptId);
    if (promptToDelete) {
      setForm({
        id: promptToDelete.id,
        name: promptToDelete.name,
        prompt: promptToDelete.prompt,
      });
      setIsDeleteDialogOpen(true);
    }
  };

  /**
   * Handle saving (create or update)
   */
  const handleSave = async () => {
    try {
      setIsSaving(true);
      clearError();

      if (form.id) {
        // Update existing prompt
        await updatePrompt(form.id, {
          name: form.name,
          prompt: form.prompt,
        });
      } else {
        // Create new prompt
        const newPrompt = await createPrompt({
          name: form.name,
          prompt: form.prompt,
        });
        // Auto-select the newly created prompt
        handleSelectPrompt(newPrompt.id);
      }

      setForm({ name: "", prompt: "" });
      setIsCreateEditDialogOpen(false);
    } catch (err) {
      console.error("Failed to save prompt:", err);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = async (id: number) => {
    await deletePrompt(id);
    setForm({ name: "", prompt: "" });
    setIsDeleteDialogOpen(false);
  };

  /**
   * Handle AI generation
   */
  const handleGenerate = (
    generatedPrompt: string,
    generatedPromptName: string
  ) => {
    setForm((prev) => ({
      ...prev,
      prompt: generatedPrompt,
      name: generatedPromptName,
    }));
  };

  const handleUseStarterTemplate = (template: StarterPromptTemplate) => {
    setForm({
      name: template.name,
      prompt: template.prompt,
    });
    setIsCreateEditDialogOpen(true);
  };

  const handleAddStarterPrompts = async () => {
    try {
      setIsAddingStarterPrompts(true);
      clearError();

      const existingNames = new Set(prompts.map((p) => p.name.trim().toLowerCase()));
      const missingTemplates = STARTER_PROMPT_TEMPLATES.filter(
        (template) => !existingNames.has(template.name.trim().toLowerCase())
      );

      await Promise.all(
        missingTemplates.map((template) =>
          createPrompt({
            name: template.name,
            prompt: template.prompt,
          })
        )
      );
    } catch (err) {
      console.error("Failed to add starter prompts:", err);
    } finally {
      setIsAddingStarterPrompts(false);
    }
  };

  /**
   * Handle selecting a prompt card
   */
  const handleCardClick = (promptId: number) => {
    handleSelectPrompt(promptId);
  };

  /**
   * Filter prompts based on search
   */
  const filteredPrompts = prompts.filter(
    (prompt) =>
      prompt.name.toLowerCase().includes(search.toLowerCase()) ||
      prompt.prompt.toLowerCase().includes(search.toLowerCase())
  );

  const sortedFilteredPrompts = [...filteredPrompts].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const savedPromptNames = new Set(
    prompts.map((prompt) => prompt.name.trim().toLowerCase())
  );

  return (
    <PageLayout
      title="Personality"
      description="Curate your assistant voice with saved personalities and reusable templates."
    >
      {/* Error Display */}
      {error && (
        <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <div className="rounded-xl border border-border/60 bg-background">
        <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm select-none">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search personalities..."
              className="h-11 border-border/50 bg-background pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="default"
            size="default"
            onClick={handleCreateClick}
            className="h-11 px-4"
          >
            <PlusIcon className="size-4" />
            Create Personality
          </Button>
        </div>

        <div className="px-5 py-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Saved Personalities</h2>
              <p className="text-sm text-muted-foreground">
                Your active and custom personalities.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {sortedFilteredPrompts.length} saved
            </span>
          </div>

          {sortedFilteredPrompts.length === 0 ? (
            <Empty
              isLoading={isLoading}
              icon={WandSparklesIcon}
              title="No personalities found"
              description="Create a new personality to get started"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedFilteredPrompts.map((prompt) => {
                const isSelected = selectedPromptId === prompt.id;
                return (
                  <Card
                    key={prompt.id}
                    className={`relative cursor-pointer gap-0 border p-4 shadow-none transition-colors ${
                      isSelected
                        ? "border-emerald-500/60 bg-emerald-500/[0.06]"
                        : "border-border/60 bg-background hover:border-emerald-500/35"
                    }`}
                    onClick={() => handleCardClick(prompt.id)}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="absolute right-4 top-4 size-4 text-emerald-500" />
                    ) : null}
                    <CardHeader className="space-y-2 p-0 pr-8">
                      <CardTitle className="text-[15px] font-medium">
                        {prompt.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-4 min-h-20 text-[12px] leading-relaxed">
                        {prompt.prompt}
                      </CardDescription>
                    </CardHeader>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">
                        {prompt.created_at}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="flex size-8 items-center justify-center rounded-md hover:bg-accent"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <MoreHorizontal className="size-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(prompt.id);
                            }}
                          >
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(prompt.id);
                            }}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-background">
        <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Starter Templates</h2>
            <p className="text-sm text-muted-foreground">
              Template-only personalities. Nothing is saved until you use one.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddStarterPrompts}
            disabled={isAddingStarterPrompts}
          >
            {isAddingStarterPrompts ? "Adding..." : "Add missing starters"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-3">
          {STARTER_PROMPT_TEMPLATES.map((template) => {
            const alreadyAdded = savedPromptNames.has(
              template.name.trim().toLowerCase()
            );

            return (
              <Card
                key={template.name}
                className="gap-3 border border-border/60 bg-background p-4 shadow-none"
              >
                <CardHeader className="space-y-2 p-0">
                  <CardTitle className="text-[15px] font-medium">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="text-[12px] leading-relaxed">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant={alreadyAdded ? "outline" : "secondary"}
                    disabled={alreadyAdded}
                    onClick={() => handleUseStarterTemplate(template)}
                  >
                    {alreadyAdded ? "Added" : "Use template"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <CreateEditDialog
        isOpen={isCreateEditDialogOpen}
        onOpenChange={setIsCreateEditDialogOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        onGenerate={handleGenerate}
        isEditing={!!form.id}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteSystemPrompt
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        promptId={form.id}
        promptName={form.name}
        onDelete={handleDeleteConfirm}
      />

    </PageLayout>
  );
};

export default SystemPrompts;
