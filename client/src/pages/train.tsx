import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dumbbell, Zap, Footprints, Target, Heart, Users } from "lucide-react";

const trainingCategories = [
  {
    title: "SAQ Drills",
    description: "Speed, Agility & Quickness drills to improve your game performance",
    icon: Zap,
    color: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10",
    items: [
      "Ladder Drills - Quick feet patterns",
      "Cone Agility - Change of direction",
      "Sprint Intervals - 20m/40m/60m",
      "Lateral Shuffle - Side-to-side movement",
    ],
  },
  {
    title: "Gym Sessions",
    description: "Strength and conditioning programs for rugby players",
    icon: Dumbbell,
    color: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10",
    items: [
      "Upper Body Power - Bench, rows, press",
      "Lower Body Strength - Squats, lunges",
      "Core Stability - Planks, rotations",
      "Full Body Circuit - Compound movements",
    ],
  },
  {
    title: "Running Programs",
    description: "Endurance and fitness programs for match preparation",
    icon: Footprints,
    color: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
    items: [
      "Easy Run - 3-5km steady pace",
      "Interval Training - 400m repeats",
      "Tempo Run - Match pace simulation",
      "Beach Run - Sand resistance training",
    ],
  },
  {
    title: "Skills Training",
    description: "Rugby-specific skills development drills",
    icon: Target,
    color: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/10",
    items: [
      "Passing Accuracy - Spiral & pop passes",
      "Tackle Technique - Safe tackling practice",
      "Ruck & Maul - Contact drills",
      "Kicking Practice - Goal & touch kicks",
    ],
  },
  {
    title: "Recovery",
    description: "Recovery and mobility sessions for injury prevention",
    icon: Heart,
    color: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-500/10",
    items: [
      "Yoga Flow - Flexibility routine",
      "Foam Rolling - Muscle recovery",
      "Stretching - Post-training routine",
      "Ice Bath Protocol - Recovery method",
    ],
  },
  {
    title: "Team Drills",
    description: "Group training exercises for team cohesion",
    icon: Users,
    color: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500/10",
    items: [
      "Touch Rugby - Small-sided games",
      "Defence Patterns - Line speed drills",
      "Attack Shapes - Phase play patterns",
      "Set Piece Practice - Scrums & lineouts",
    ],
  },
];

export default function TrainPage() {
  return (
    <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-bold" data-testid="text-train-title">Train</h2>
        <p className="text-sm text-muted-foreground">
          Rugby training programs and drills
        </p>
      </div>

      <Accordion type="multiple" className="w-full">
        {trainingCategories.map((category, index) => (
          <AccordionItem
            key={category.title}
            value={category.title}
            data-testid={`accordion-training-${category.title.toLowerCase().replace(/\s+/g, '-')}`}
            className={index === trainingCategories.length - 1 ? "border-b-0" : ""}
          >
            <AccordionTrigger className="py-3 hover:no-underline" data-testid={`button-expand-${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${category.iconBg}`}>
                  <category.icon className={`w-4 h-4 ${category.color}`} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-sm">{category.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {category.description}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-12 pb-1">
                {category.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                    data-testid={`text-drill-${category.title.toLowerCase().replace(/\s+/g, '-')}-${idx}`}
                  >
                    <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                    <span>{item}</span>
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
