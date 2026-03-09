import {
  Settings,
  Code,
  CalendarDays,
  MessagesSquare,
  WandSparkles,
  SlidersHorizontalIcon,
  SquareSlashIcon,
  BookOpenTextIcon,
  PowerIcon,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

export const useMenuItems = () => {
  const menu: {
    icon: React.ElementType;
    label: string;
    href: string;
    count?: number;
  }[] = [
    {
      icon: MessagesSquare,
      label: "Chats",
      href: "/chats",
    },
    {
      icon: WandSparkles,
      label: "Personality",
      href: "/system-prompts",
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/settings",
    },
    {
      icon: SlidersHorizontalIcon,
      label: "Inputs",
      href: "/inputs",
    },
    {
      icon: CalendarDays,
      label: "Calendar",
      href: "/calendar",
    },
    {
      icon: SquareSlashIcon,
      label: "Keybinds",
      href: "/shortcuts",
    },
    {
      icon: BookOpenTextIcon,
      label: "Instructions",
      href: "/instructions",
    },

    {
      icon: Code,
      label: "Config",
      href: "/dev-space",
    },
  ];

  const footerItems = [
    {
      icon: PowerIcon,
      label: "Quit Echo App",
      action: async () => {
        await invoke("exit_app");
      },
    },
  ];

  const footerLinks: {
    title: string;
    icon: React.ElementType;
    link: string;
  }[] = [];

  return {
    menu,
    footerItems,
    footerLinks,
  };
};
