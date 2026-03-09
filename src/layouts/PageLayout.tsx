import { Header, ScrollArea } from "@/components";

export const PageLayout = ({
  children,
  title,
  description,
  rightSlot,
  allowBackButton = false,
  isMainTitle = true,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  rightSlot?: React.ReactNode;
  allowBackButton?: boolean;
  isMainTitle?: boolean;
}) => {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col pt-8">
      <header className="shrink-0">
        <Header
          isMainTitle={isMainTitle}
          showBorder={true}
          title={title}
          description={description}
          rightSlot={rightSlot}
          allowBackButton={allowBackButton}
        />
      </header>

      <ScrollArea className="min-h-0 flex-1 pr-6">
        <div className="flex flex-col gap-6 px-1 pb-12 pt-5">{children}</div>
      </ScrollArea>
    </div>
  );
};
