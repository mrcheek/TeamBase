import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Zap, Footprints, Target, Heart, Users } from "lucide-react";

const trainingCategories = [
  {
    title: "SAQ Drills",
    description: "Speed, Agility & Quickness drills to improve your game performance",
    icon: Zap,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
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
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
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
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
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
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
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
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
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
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
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

      <div className="space-y-4">
        {trainingCategories.map((category) => (
          <Card key={category.title} data-testid={`card-training-${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${category.color.split(" ")[0]}`}>
                  <category.icon className={`w-5 h-5 ${category.color.split(" ").slice(1).join(" ")}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{category.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {category.description}
                  </p>
                </div>
              </div>
              <div className="space-y-2 ml-13">
                {category.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
