import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Zap, Footprints, Target, Heart, Users, ChevronRight } from "lucide-react";

const trainingCategories = [
  {
    title: "SAQ Drills",
    description: "Speed, Agility & Quickness",
    icon: Zap,
    color: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10",
    accentBar: "bg-amber-500",
    items: [
      { name: "Ladder Drills", detail: "Quick feet patterns" },
      { name: "Cone Agility", detail: "Change of direction" },
      { name: "Sprint Intervals", detail: "20m / 40m / 60m" },
      { name: "Lateral Shuffle", detail: "Side-to-side movement" },
    ],
  },
  {
    title: "Gym Sessions",
    description: "Strength & Conditioning",
    icon: Dumbbell,
    color: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10",
    accentBar: "bg-blue-500",
    items: [
      { name: "Upper Body Power", detail: "Bench, rows, press" },
      { name: "Lower Body Strength", detail: "Squats, lunges" },
      { name: "Core Stability", detail: "Planks, rotations" },
      { name: "Full Body Circuit", detail: "Compound movements" },
    ],
  },
  {
    title: "Running Programs",
    description: "Endurance & Match Fitness",
    icon: Footprints,
    color: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
    accentBar: "bg-emerald-500",
    items: [
      { name: "Easy Run", detail: "3-5km steady pace" },
      { name: "Interval Training", detail: "400m repeats" },
      { name: "Tempo Run", detail: "Match pace simulation" },
      { name: "Beach Run", detail: "Sand resistance training" },
    ],
  },
  {
    title: "Skills Training",
    description: "Rugby-Specific Development",
    icon: Target,
    color: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/10",
    accentBar: "bg-purple-500",
    items: [
      { name: "Passing Accuracy", detail: "Spiral & pop passes" },
      { name: "Tackle Technique", detail: "Safe tackling practice" },
      { name: "Ruck & Maul", detail: "Contact drills" },
      { name: "Kicking Practice", detail: "Goal & touch kicks" },
    ],
  },
  {
    title: "Recovery",
    description: "Mobility & Injury Prevention",
    icon: Heart,
    color: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-500/10",
    accentBar: "bg-red-500",
    items: [
      { name: "Yoga Flow", detail: "Flexibility routine" },
      { name: "Foam Rolling", detail: "Muscle recovery" },
      { name: "Stretching", detail: "Post-training routine" },
      { name: "Ice Bath Protocol", detail: "Recovery method" },
    ],
  },
  {
    title: "Team Drills",
    description: "Group Training & Cohesion",
    icon: Users,
    color: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500/10",
    accentBar: "bg-cyan-500",
    items: [
      { name: "Touch Rugby", detail: "Small-sided games" },
      { name: "Defence Patterns", detail: "Line speed drills" },
      { name: "Attack Shapes", detail: "Phase play patterns" },
      { name: "Set Piece Practice", detail: "Scrums & lineouts" },
    ],
  },
];

export default function TrainPage() {
  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-train-title">
          Training Library
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Programs and drills to elevate your game
        </p>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Badge variant="secondary" data-testid="badge-category-count">
          {trainingCategories.length} Categories
        </Badge>
        <Badge variant="secondary" data-testid="badge-drill-count">
          {trainingCategories.reduce((sum, c) => sum + c.items.length, 0)} Drills
        </Badge>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {trainingCategories.map((category) => (
          <AccordionItem
            key={category.title}
            value={category.title}
            data-testid={`accordion-training-${category.title.toLowerCase().replace(/\s+/g, '-')}`}
            className="border border-border rounded-md overflow-hidden"
          >
            <AccordionTrigger
              className="px-3 py-3 hover:no-underline hover-elevate"
              data-testid={`button-expand-${category.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${category.iconBg}`}>
                  <category.icon className={`w-4 h-4 ${category.color}`} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-sm leading-tight">{category.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {category.description}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 pt-0">
              <div className="border-t border-border pt-2">
                {category.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 group"
                    data-testid={`text-drill-${category.title.toLowerCase().replace(/\s+/g, '-')}-${idx}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-1 h-6 rounded-full ${category.accentBar} shrink-0 opacity-60`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
