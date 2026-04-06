import { useCompletion } from "@/hooks";
import { Screenshot } from "./Screenshot";
import { Input } from "./Input";

export const Completion = ({ isHidden }: { isHidden: boolean }) => {
  const completion = useCompletion();

  return (
    <>
      <Input {...completion} isHidden={isHidden} />
      <Screenshot {...completion} />
    </>
  );
};
