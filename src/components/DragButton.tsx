import { useEffect } from "react";
import { GripVerticalIcon } from "lucide-react";
import { Button } from "@/components";
import { useWindowResize } from "@/hooks";

export const DragButton = () => {
  const { resizeWindow } = useWindowResize();

  useEffect(() => {
    resizeWindow(false);
  }, [resizeWindow]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`-ml-[2px] w-fit`}
      data-tauri-drag-region={true}
    >
      <GripVerticalIcon className="h-4 w-4" />
    </Button>
  );
};
