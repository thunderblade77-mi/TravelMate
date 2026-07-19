import type { ReactNode } from "react";
import { QuickActionButton } from "../ui/QuickActionButton";
import {
  BookIcon,
  LocationIcon,
  PlayIcon,
  WalletIcon,
} from "../icons";

type QuickAction = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
};

const quickActions: QuickAction[] = [
  {
    id: "newTrip",
    label: "Nuovo viaggio",
    icon: <PlayIcon className="h-6 w-6" />,
  },
  {
    id: "roadbook",
    label: "Roadbook",
    icon: <BookIcon className="h-6 w-6" />,
  },
  {
    id: "map",
    label: "Mappa Live",
    icon: <LocationIcon className="h-6 w-6" />,
  },
  {
    id: "expenses",
    label: "Spese",
    icon: <WalletIcon className="h-6 w-6" />,
  },
];

export function QuickActionsGrid() {
  return (
    <section
      aria-label="Azioni rapide"
      className="grid grid-cols-2 gap-3"
    >
      {quickActions.map((action) => (
        <QuickActionButton
          key={action.id}
          label={action.label}
          icon={action.icon}
          onClick={action.onClick}
        />
      ))}
    </section>
  );
}