import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Settings2,
  User,
  Bell,
  Shield,
  Palette,
  Users,
  Mail,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Upload
} from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({
    name: "Sarah Chen",
    email: "sarah.chen@company.com",
    role: "Engineering Lead",
    timezone: "America/New_York",
    bio: "Leading platform engineering and incident response.",
  });

  const [notifications, setNotifications] = useState({
    emailDecisions: true,
    emailMeetings: false,
    emailDigest: true,
    pushNewEvents: true,
    pushMentions: true,
    pushDeadlines: true,
    digestFrequency: "daily",
  });

  const [appearance, setAppearance] = useState({
    theme: "dark",
    compactMode: false,
    animationsEnabled: true,
    timelineLayout: "alternating",
    defaultView: "grid",
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    activityVisible: true,
    showEmail: false,
    twoFactorEnabled: false,
    sessionTimeout: "30",
  });

  const [teamMembers] = useState([
    { name: "Marcus Johnson", email: "marcus@company.com", role: "Admin" },
    { name: "Alex Rivera", email: "alex@company.com", role: "Editor" },
    { name: "Priya Patel", email: "priya@company.com", role: "Editor" },
    { name: "Jordan Kim", email: "jordan@company.com", role: "Viewer" },
    { name: "Emily Zhang", email: "emily@company.com", role: "Editor" },
  ]);

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account, preferences, and team configuration.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/50 border border-white/5 p-1 h-auto flex-wrap">
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-card" data-testid="tab-profile">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-card" data-testid="tab-notifications">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 data-[state=active]:bg-card" data-testid="tab-appearance">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2 data-[state=active]:bg-card" data-testid="tab-privacy">
            <Shield className="w-4 h-4" />
            Privacy & Security
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2 data-[state=active]:bg-card" data-testid="tab-team">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-2xl font-bold text-primary">
                  SC
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="gap-2" data-testid="button-upload-avatar">
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="bg-black/20 border-white/10"
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="bg-black/20 border-white/10"
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className="bg-black/20 border-white/10"
                    data-testid="input-role"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={profile.timezone} onValueChange={(v) => setProfile({ ...profile, timezone: v })}>
                    <SelectTrigger className="bg-black/20 border-white/10" data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="bg-black/20 border-white/10 resize-none"
                  rows={3}
                  data-testid="input-bio"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" className="gap-2" data-testid="button-reset-profile">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button onClick={handleSave} className="gap-2" data-testid="button-save-profile">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Choose what updates you receive via email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">New Decisions</Label>
                  <p className="text-sm text-muted-foreground">Get notified when a decision is logged in your projects.</p>
                </div>
                <Switch
                  checked={notifications.emailDecisions}
                  onCheckedChange={(v) => setNotifications({ ...notifications, emailDecisions: v })}
                  data-testid="switch-email-decisions"
                />
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Meeting Summaries</Label>
                  <p className="text-sm text-muted-foreground">Receive AI-generated meeting summaries after processing.</p>
                </div>
                <Switch
                  checked={notifications.emailMeetings}
                  onCheckedChange={(v) => setNotifications({ ...notifications, emailMeetings: v })}
                  data-testid="switch-email-meetings"
                />
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">Summary of all project activity and decisions.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={notifications.digestFrequency}
                    onValueChange={(v) => setNotifications({ ...notifications, digestFrequency: v })}
                  >
                    <SelectTrigger className="w-28 bg-black/20 border-white/10" data-testid="select-digest-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Switch
                    checked={notifications.emailDigest}
                    onCheckedChange={(v) => setNotifications({ ...notifications, emailDigest: v })}
                    data-testid="switch-email-digest"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Push Notifications
              </CardTitle>
              <CardDescription>In-app notification preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">New Events</Label>
                  <p className="text-sm text-muted-foreground">When new events are added to your projects.</p>
                </div>
                <Switch
                  checked={notifications.pushNewEvents}
                  onCheckedChange={(v) => setNotifications({ ...notifications, pushNewEvents: v })}
                  data-testid="switch-push-events"
                />
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Mentions</Label>
                  <p className="text-sm text-muted-foreground">When someone mentions you in a note or action item.</p>
                </div>
                <Switch
                  checked={notifications.pushMentions}
                  onCheckedChange={(v) => setNotifications({ ...notifications, pushMentions: v })}
                  data-testid="switch-push-mentions"
                />
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Deadline Reminders</Label>
                  <p className="text-sm text-muted-foreground">Reminders for upcoming action item deadlines.</p>
                </div>
                <Switch
                  checked={notifications.pushDeadlines}
                  onCheckedChange={(v) => setNotifications({ ...notifications, pushDeadlines: v })}
                  data-testid="switch-push-deadlines"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" className="gap-2" data-testid="button-reset-notifications">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button onClick={handleSave} className="gap-2" data-testid="button-save-notifications">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>Customize how Better Decisions looks and feels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "dark", label: "Dark", preview: "bg-gray-900 border-gray-700" },
                    { value: "light", label: "Light", preview: "bg-white border-gray-300" },
                    { value: "system", label: "System", preview: "bg-gradient-to-r from-gray-900 to-white border-gray-500" },
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => setAppearance({ ...appearance, theme: theme.value })}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all text-center
                        ${appearance.theme === theme.value
                          ? 'border-primary bg-primary/5'
                          : 'border-white/10 hover:border-white/20'
                        }
                      `}
                      data-testid={`button-theme-${theme.value}`}
                    >
                      <div className={`w-full h-8 rounded ${theme.preview} border mb-2`} />
                      <span className="text-sm font-medium">{theme.label}</span>
                      {appearance.theme === theme.value && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Reduce spacing and padding for a denser layout.</p>
                </div>
                <Switch
                  checked={appearance.compactMode}
                  onCheckedChange={(v) => setAppearance({ ...appearance, compactMode: v })}
                  data-testid="switch-compact-mode"
                />
              </div>

              <Separator className="bg-white/10" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Animations</Label>
                  <p className="text-sm text-muted-foreground">Enable smooth transitions and motion effects.</p>
                </div>
                <Switch
                  checked={appearance.animationsEnabled}
                  onCheckedChange={(v) => setAppearance({ ...appearance, animationsEnabled: v })}
                  data-testid="switch-animations"
                />
              </div>

              <Separator className="bg-white/10" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Timeline Layout</Label>
                  <p className="text-sm text-muted-foreground">How events are displayed on the decision stream.</p>
                </div>
                <Select
                  value={appearance.timelineLayout}
                  onValueChange={(v) => setAppearance({ ...appearance, timelineLayout: v })}
                >
                  <SelectTrigger className="w-36 bg-black/20 border-white/10" data-testid="select-timeline-layout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alternating">Alternating</SelectItem>
                    <SelectItem value="left">Left Aligned</SelectItem>
                    <SelectItem value="compact">Compact List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-white/10" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Default Project View</Label>
                  <p className="text-sm text-muted-foreground">How projects are displayed on the main page.</p>
                </div>
                <Select
                  value={appearance.defaultView}
                  onValueChange={(v) => setAppearance({ ...appearance, defaultView: v })}
                >
                  <SelectTrigger className="w-28 bg-black/20 border-white/10" data-testid="select-default-view">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" className="gap-2" data-testid="button-reset-appearance">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button onClick={handleSave} className="gap-2" data-testid="button-save-appearance">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control who can see your information and activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">Allow team members to view your profile details.</p>
                </div>
                <Switch
                  checked={privacy.profileVisible}
                  onCheckedChange={(v) => setPrivacy({ ...privacy, profileVisible: v })}
                  data-testid="switch-profile-visible"
                />
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Activity Visibility</Label>
                  <p className="text-sm text-muted-foreground">Show your recent actions in the activity feed.</p>
                </div>
                <Switch
                  checked={privacy.activityVisible}
                  onCheckedChange={(v) => setPrivacy({ ...privacy, activityVisible: v })}
                  data-testid="switch-activity-visible"
                />
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Show Email Address</Label>
                  <p className="text-sm text-muted-foreground">Display your email to other team members.</p>
                </div>
                <Switch
                  checked={privacy.showEmail}
                  onCheckedChange={(v) => setPrivacy({ ...privacy, showEmail: v })}
                  data-testid="switch-show-email"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription>Protect your account with additional security measures.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                </div>
                <div className="flex items-center gap-3">
                  {privacy.twoFactorEnabled ? (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20">Enabled</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Disabled</Badge>
                  )}
                  <Switch
                    checked={privacy.twoFactorEnabled}
                    onCheckedChange={(v) => setPrivacy({ ...privacy, twoFactorEnabled: v })}
                    data-testid="switch-2fa"
                  />
                </div>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">Automatically log out after inactivity.</p>
                </div>
                <Select
                  value={privacy.sessionTimeout}
                  onValueChange={(v) => setPrivacy({ ...privacy, sessionTimeout: v })}
                >
                  <SelectTrigger className="w-32 bg-black/20 border-white/10" data-testid="select-session-timeout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Change Password</Label>
                  <p className="text-sm text-muted-foreground">Update your account password.</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-change-password">
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" className="gap-2" data-testid="button-reset-privacy">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button onClick={handleSave} className="gap-2" data-testid="button-save-privacy">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage who has access to your workspace.</CardDescription>
                </div>
                <Button size="sm" className="gap-2" data-testid="button-invite-member">
                  <Plus className="w-4 h-4" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map((member, i) => (
                  <motion.div
                    key={member.email}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-colors group"
                    data-testid={`row-member-${i}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium border border-white/5">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <Select defaultValue={member.role.toLowerCase()}>
                      <SelectTrigger className="w-28 bg-black/20 border-white/10 h-8 text-xs" data-testid={`select-role-${i}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      data-testid={`button-remove-member-${i}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Workspace Settings
              </CardTitle>
              <CardDescription>Configure workspace-level preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Workspace Name</Label>
                <Input defaultValue="Engineering Team" className="bg-black/20 border-white/10" data-testid="input-workspace-name" />
              </div>
              <div className="space-y-2">
                <Label>Default Project Visibility</Label>
                <Select defaultValue="team">
                  <SelectTrigger className="bg-black/20 border-white/10" data-testid="select-project-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private - Only project members</SelectItem>
                    <SelectItem value="team">Team - All workspace members</SelectItem>
                    <SelectItem value="public">Public - Anyone with link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" className="gap-2" data-testid="button-reset-team">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button onClick={handleSave} className="gap-2" data-testid="button-save-team">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
