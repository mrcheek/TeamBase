import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from "lucide-react";
import type { Club } from "@shared/schema";

export default function CompleteProfilePage() {
  const { user, updateProfile, profileCompletion } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("personal");

  const { data: clubs } = useQuery<Club[]>({ queryKey: ["/api/clubs"] });

  const [form, setForm] = useState({
    dateOfBirth: user?.dateOfBirth || "",
    gender: user?.gender || "",
    nationality: user?.nationality || "",
    email: user?.email || "",
    residentialCountry: user?.residentialCountry || "",
    emergencyContactName: user?.emergencyContactName || "",
    emergencyContactNumber: user?.emergencyContactNumber || "",
    role: user?.role || "player",
    registrationType: user?.registrationType || "new",
    clubId: "",
    position: user?.position || "",
    playingLevel: user?.playingLevel || "",
    height: user?.height || "",
    weight: user?.weight || "",
    medicalConditions: user?.medicalConditions || "",
    previousClubs: user?.previousClubs || "",
    coachingCertification: user?.coachingCertification || "",
    coachingExperience: user?.coachingExperience || "",
    teamCoached: user?.teamCoached || "",
    coachingSpecialization: user?.coachingSpecialization || "",
    personnelRole: user?.personnelRole || "",
    personnelQualifications: user?.personnelQualifications || "",
    personnelExperience: user?.personnelExperience || "",
    photoConsent: user?.photoConsent ?? false,
    dataConsent: user?.dataConsent ?? false,
    password: "",
  });

  const update = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: Record<string, any> = { ...form };
      if (payload.clubId) payload.clubId = parseInt(payload.clubId);
      else delete payload.clubId;
      if (!payload.password || payload.password.length < 6) delete payload.password;
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "" || payload[k] === undefined) delete payload[k];
      });
      payload.photoConsent = form.photoConsent;
      payload.dataConsent = form.dataConsent;
      await updateProfile(payload);
      toast({ title: "Profile updated", description: "Your registration details have been saved." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ id, title, icon }: { id: string; title: string; icon: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between gap-2 py-3 text-left"
      data-testid={`button-section-${id}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold text-sm">{title}</span>
      </div>
      {expandedSection === id ? (
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );

  if (!user) return null;

  return (
    <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-bold" data-testid="text-complete-profile-title">Complete Your Registration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in your details to complete your ZRF membership registration.
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm font-bold text-primary" data-testid="text-profile-completion">
              {profileCompletion}%
            </span>
          </div>
          <Progress value={profileCompletion} className="h-2.5" />
          {profileCompletion < 100 && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Complete all sections to finish your registration
            </p>
          )}
          {profileCompletion >= 100 && (
            <p className="text-xs text-primary mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Registration complete!
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Card>
          <CardContent className="px-4 py-0">
            <SectionHeader id="personal" title="Personal Information" icon={<span className="text-base">👤</span>} />
            {expandedSection === "personal" && (
              <div className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => update("dateOfBirth", e.target.value)}
                    data-testid="input-dob"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input
                    value={form.nationality}
                    onChange={(e) => update("nationality", e.target.value)}
                    placeholder="e.g. Tanzanian"
                    data-testid="input-nationality"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="email@example.com"
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country of Residence</Label>
                  <Input
                    value={form.residentialCountry}
                    onChange={(e) => update("residentialCountry", e.target.value)}
                    placeholder="e.g. Tanzania"
                    data-testid="input-residential-country"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-0">
            <SectionHeader id="emergency" title="Emergency Contact" icon={<span className="text-base">🚨</span>} />
            {expandedSection === "emergency" && (
              <div className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    value={form.emergencyContactName}
                    onChange={(e) => update("emergencyContactName", e.target.value)}
                    placeholder="Full name of emergency contact"
                    data-testid="input-emergency-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone Number</Label>
                  <Input
                    value={form.emergencyContactNumber}
                    onChange={(e) => update("emergencyContactNumber", e.target.value)}
                    placeholder="+255 7XX XXX XXX"
                    data-testid="input-emergency-phone"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-0">
            <SectionHeader id="rugby" title="Rugby Registration" icon={<span className="text-base">🏉</span>} />
            {expandedSection === "rugby" && (
              <div className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => update("role", v)}>
                    <SelectTrigger data-testid="select-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="player">Player</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                      <SelectItem value="personnel">Personnel / Official</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Registration Type</Label>
                  <Select value={form.registrationType} onValueChange={(v) => update("registrationType", v)}>
                    <SelectTrigger data-testid="select-registration-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Registration</SelectItem>
                      <SelectItem value="renewal">Renewal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {clubs && clubs.length > 0 && (
                  <div className="space-y-2">
                    <Label>Club</Label>
                    <Select value={form.clubId} onValueChange={(v) => update("clubId", v)}>
                      <SelectTrigger data-testid="select-club">
                        <SelectValue placeholder="Select a club" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.map((club) => (
                          <SelectItem key={club.id} value={String(club.id)}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {form.role === "player" && (
          <Card>
            <CardContent className="px-4 py-0">
              <SectionHeader id="player" title="Player Details" icon={<span className="text-base">💪</span>} />
              {expandedSection === "player" && (
                <div className="space-y-4 pb-4">
                  <div className="space-y-2">
                    <Label>Playing Position</Label>
                    <Input
                      value={form.position}
                      onChange={(e) => update("position", e.target.value)}
                      placeholder="e.g. Fly-half, Prop, Fullback"
                      data-testid="input-position"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Playing Level</Label>
                    <Select value={form.playingLevel} onValueChange={(v) => update("playingLevel", v)}>
                      <SelectTrigger data-testid="select-playing-level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youth">Youth</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="veteran">Veteran</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Height (cm)</Label>
                      <Input
                        value={form.height}
                        onChange={(e) => update("height", e.target.value)}
                        placeholder="175"
                        data-testid="input-height"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Weight (kg)</Label>
                      <Input
                        value={form.weight}
                        onChange={(e) => update("weight", e.target.value)}
                        placeholder="80"
                        data-testid="input-weight"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Medical Conditions</Label>
                    <Textarea
                      value={form.medicalConditions}
                      onChange={(e) => update("medicalConditions", e.target.value)}
                      placeholder="Any medical conditions to be aware of (optional)"
                      rows={2}
                      data-testid="input-medical"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Previous Clubs</Label>
                    <Input
                      value={form.previousClubs}
                      onChange={(e) => update("previousClubs", e.target.value)}
                      placeholder="List any previous rugby clubs"
                      data-testid="input-previous-clubs"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {form.role === "coach" && (
          <Card>
            <CardContent className="px-4 py-0">
              <SectionHeader id="coach" title="Coach Details" icon={<span className="text-base">📋</span>} />
              {expandedSection === "coach" && (
                <div className="space-y-4 pb-4">
                  <div className="space-y-2">
                    <Label>Coaching Certification</Label>
                    <Input
                      value={form.coachingCertification}
                      onChange={(e) => update("coachingCertification", e.target.value)}
                      placeholder="e.g. World Rugby Level 1"
                      data-testid="input-coaching-cert"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Coaching Experience</Label>
                    <Textarea
                      value={form.coachingExperience}
                      onChange={(e) => update("coachingExperience", e.target.value)}
                      placeholder="Describe your coaching experience"
                      rows={2}
                      data-testid="input-coaching-exp"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Team Coached</Label>
                    <Input
                      value={form.teamCoached}
                      onChange={(e) => update("teamCoached", e.target.value)}
                      placeholder="Current or most recent team"
                      data-testid="input-team-coached"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Specialization</Label>
                    <Input
                      value={form.coachingSpecialization}
                      onChange={(e) => update("coachingSpecialization", e.target.value)}
                      placeholder="e.g. Forwards, Backs, Defense"
                      data-testid="input-specialization"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {form.role === "personnel" && (
          <Card>
            <CardContent className="px-4 py-0">
              <SectionHeader id="personnel" title="Personnel Details" icon={<span className="text-base">🏢</span>} />
              {expandedSection === "personnel" && (
                <div className="space-y-4 pb-4">
                  <div className="space-y-2">
                    <Label>Role Description</Label>
                    <Input
                      value={form.personnelRole}
                      onChange={(e) => update("personnelRole", e.target.value)}
                      placeholder="e.g. Referee, Medic, Administrator"
                      data-testid="input-personnel-role"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Qualifications</Label>
                    <Textarea
                      value={form.personnelQualifications}
                      onChange={(e) => update("personnelQualifications", e.target.value)}
                      placeholder="Relevant qualifications"
                      rows={2}
                      data-testid="input-personnel-quals"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Experience</Label>
                    <Textarea
                      value={form.personnelExperience}
                      onChange={(e) => update("personnelExperience", e.target.value)}
                      placeholder="Relevant experience"
                      rows={2}
                      data-testid="input-personnel-exp"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="px-4 py-0">
            <SectionHeader id="security" title="Set Password" icon={<span className="text-base">🔒</span>} />
            {expandedSection === "security" && (
              <div className="space-y-4 pb-4">
                <p className="text-xs text-muted-foreground">
                  Set a password so you can sign in again later.
                </p>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="At least 6 characters"
                    data-testid="input-set-password"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-0">
            <SectionHeader id="consent" title="Consent & Declaration" icon={<span className="text-base">✅</span>} />
            {expandedSection === "consent" && (
              <div className="space-y-4 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Photo Consent</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      I agree that my photo may be used by ZRF for promotional materials and social media.
                    </p>
                  </div>
                  <Switch
                    checked={form.photoConsent}
                    onCheckedChange={(v) => update("photoConsent", v)}
                    data-testid="switch-photo-consent"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Data Consent</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      I consent to ZRF storing and processing my personal data for rugby administration purposes.
                    </p>
                  </div>
                  <Switch
                    checked={form.dataConsent}
                    onCheckedChange={(v) => update("dataConsent", v)}
                    data-testid="switch-data-consent"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button
          className="w-full"
          size="lg"
          onClick={handleSave}
          disabled={loading}
          data-testid="button-save-profile"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Registration"
          )}
        </Button>
      </div>
    </div>
  );
}
