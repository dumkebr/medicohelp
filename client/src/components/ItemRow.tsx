import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Save, Edit2, Trash2 } from "lucide-react";
import { isSaved, setSaved, renameAtendimento } from "@/lib/atendimentos";

export function ItemRow({
  item,
  isActive,
  onOpen,
  onDelete,
  refresh,
}: {
  item: any;
  isActive: boolean;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
  refresh: () => void;
}) {
  const saved = isSaved(item);

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    const novo = prompt("Renomear para:", item.title || "");
    if (novo != null && novo.trim()) {
      renameAtendimento(item.id, novo);
      refresh();
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(item.id, true);
    refresh();
  };

  const handleUnsave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(item.id, false);
    refresh();
  };

  return (
    <div
      onClick={onOpen}
      className={`relative p-2 cursor-pointer ${
        isActive 
          ? "bg-emerald-50 dark:bg-emerald-900/20" 
          : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
      }`}
      title={new Date(item.updatedAt).toLocaleString()}
      data-testid={saved ? `atendimento-salvo-${item.id}` : `atendimento-volatil-${item.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="truncate text-sm text-neutral-900 dark:text-white">
            {item.title}
          </div>
          {saved && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex-shrink-0">
              Salvo
            </span>
          )}
          {item.patientId && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1 flex-shrink-0">
              Paciente
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
              data-testid={`button-menu-${item.id}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {saved ? (
              <>
                {!item.patientId && (
                  <>
                    <DropdownMenuItem onClick={handleUnsave} data-testid={`menu-unsave-${item.id}`}>
                      <Save className="w-4 h-4 mr-2" />
                      Desfixar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleRename} data-testid={`menu-rename-${item.id}`}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 dark:text-red-400"
                  data-testid={`menu-delete-${item.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={handleSave} data-testid={`menu-save-${item.id}`}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRename} data-testid={`menu-rename-${item.id}`}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 dark:text-red-400"
                  data-testid={`menu-delete-${item.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
