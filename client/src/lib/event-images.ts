const eventTypeImages: Record<string, string> = {
  training: "/images/events/training.png",
  match: "/images/events/match.png",
  tournament: "/images/events/tournament.png",
  touch_rugby: "/images/events/touch_rugby.png",
  social: "/images/events/social.png",
};

export function getEventImage(type: string): string {
  return eventTypeImages[type] || eventTypeImages.training;
}
