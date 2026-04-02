"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Shield,
  Clock,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  Zap,
  Save,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/Badge";

const activityStats = [
  { label: "Total Queries", value: "1,284", icon: MessageSquare, change: "+12% this month" },
  { label: "Avg Response Time", value: "1.8s", icon: Clock, change: "-0.3s vs last month" },
  { label: "Acceptance Rate", value: "91%", icon: ThumbsUp, change: "+3% this month" },
  { label: "Prompts Created", value: "8", icon: Zap, change: "2 new this week" },
];

const recentActivity = [
  { action: "Ran prompt", detail: "ETEC CPH: India, Mexico, Brazil vs USA", time: "2 hours ago" },
  { action: "Created prompt", detail: "Custom: Q2 Budget Variance Deep Dive", time: "5 hours ago" },
  { action: "Viewed data cube", detail: "Revenue by Region", time: "1 day ago" },
  { action: "Uploaded document", detail: "ETEC_CPH_Report_FY25_Q4.pdf", time: "1 day ago" },
  { action: "Ran prompt", detail: "Month-on-Month CPH (IN, MX, BR)", time: "2 days ago" },
  { action: "Rated response", detail: "Accepted: Attrition Risk Assessment", time: "3 days ago" },
];

export default function ProfilePage() {
  const { data: session } = useSession();
  const [displayName, setDisplayName] = useState(session?.user?.name ?? "Admin");
  const [department, setDepartment] = useState("ETEC Operations");
  const [location, setLocation] = useState("Pune");
  const [saved, setSaved] = useState(false);

  const email = session?.user?.email ?? "admin@insightx.com";
  const role = session?.user?.role ?? "admin";
  const initials = (displayName?.charAt(0) ?? "U").toUpperCase();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-auto bg-gray-50/50">
      <div className="p-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
            <User className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
            <p className="text-sm text-gray-500">Manage your account information and view activity</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Profile info */}
          <div className="col-span-7 space-y-5">
            {/* Avatar & basic info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-5 mb-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-green-700 flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
                  <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <Camera className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{displayName}</h2>
                  <p className="text-sm text-gray-500">{email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={role === "admin" ? "success" : "default"}>
                      <Shield className="h-3 w-3 mr-1" />
                      {role === "admin" ? "Administrator" : "User"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Display Name</label>
                  <input
                    type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-500">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {email}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                    <option>ETEC Operations</option>
                    <option>Engineering</option>
                    <option>Manufacturing</option>
                    <option>Finance</option>
                    <option>HR</option>
                    <option>IT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                  <select value={location} onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                    <option>Pune</option>
                    <option>Chicago</option>
                    <option>Monterrey</option>
                    <option>Indore</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-5">
                <button onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors">
                  <Save className="h-4 w-4" />
                  {saved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-800">
                        <span className="font-medium">{item.action}</span>
                        <span className="text-gray-500"> — {item.detail}</span>
                      </div>
                      <div className="text-[11px] text-gray-400">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="col-span-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Your Activity Stats</h3>
            {activityStats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <stat.icon className="h-5 w-5 text-green-700" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 uppercase font-medium">{stat.label}</div>
                  <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-[11px] text-green-600 font-medium">{stat.change}</div>
                </div>
              </div>
            ))}

            {/* Account info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Account Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Role</span>
                  <span className="font-medium text-gray-900 capitalize">{role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Member since</span>
                  <span className="font-medium text-gray-900">Jan 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last login</span>
                  <span className="font-medium text-gray-900">Just now</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Data access</span>
                  <span className="font-medium text-gray-900">Full</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
