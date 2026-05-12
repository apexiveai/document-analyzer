"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Mail,
  X,
  Crown,
  Eye,
  Edit3,
  Trash2,
} from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: "owner" | "editor" | "viewer";
  avatar?: string;
  joinedAt: string;
}

// interface TeamWorkspaceProps {
//   documentId?: string
// }

export default function TeamWorkspace() {
  const [isOpen, setIsOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [isInviting, setIsInviting] = useState(false);

  // Mock team members data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "1",
      email: "john@company.com",
      name: "John Doe",
      role: "owner",
      joinedAt: "2024-01-15",
    },
    {
      id: "2",
      email: "sarah@company.com",
      name: "Sarah Wilson",
      role: "editor",
      joinedAt: "2024-02-20",
    },
    {
      id: "3",
      email: "mike@company.com",
      name: "Mike Johnson",
      role: "viewer",
      joinedAt: "2024-03-10",
    },
  ]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);

    // Simulate API call
    setTimeout(() => {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        email: inviteEmail,
        name: inviteEmail.split("@")[0],
        role: inviteRole,
        joinedAt: new Date().toISOString().split("T")[0],
      };

      setTeamMembers((prev) => [...prev, newMember]);
      setInviteEmail("");
      setIsInviting(false);
    }, 1000);
  };

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers((prev) => prev.filter((member) => member.id !== memberId));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "editor":
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      case "viewer":
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      owner: "bg-yellow-100 text-yellow-700 border-yellow-200",
      editor: "bg-blue-100 text-blue-700 border-blue-200",
      viewer: "bg-gray-100 text-gray-700 border-gray-200",
    };

    return `px-2 py-1 text-xs font-medium rounded-full border ${styles[role as keyof typeof styles]}`;
  };

  return (
    <>
      {/* Invite Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        <span>Invite</span>
      </motion.button>

      {/* Team Workspace Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 bg-linear-to-r from-blue-50 to-indigo-50 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Team Workspace
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Invite Section */}
                  <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      Invite Team Member
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <input
                          type="email"
                          placeholder="Enter email address"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={inviteRole}
                          onChange={(e) =>
                            setInviteRole(e.target.value as "editor" | "viewer")
                          }
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>

                        <motion.button
                          onClick={handleInvite}
                          disabled={!inviteEmail.trim() || isInviting}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                        >
                          {isInviting ? "Inviting..." : "Invite"}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      Team Members ({teamMembers.length})
                    </h4>

                    <div className="space-y-2">
                      {teamMembers.map((member) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-linear-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1">
                              {getRoleIcon(member.role)}
                              <span className={getRoleBadge(member.role)}>
                                {member.role.charAt(0).toUpperCase() +
                                  member.role.slice(1)}
                              </span>
                            </div>

                            {member.role !== "owner" && (
                              <motion.button
                                onClick={() => handleRemoveMember(member.id)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Permissions Info */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Permission Levels
                    </h5>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Crown className="w-3 h-3 text-yellow-500" />
                        <span>
                          <strong>Owner:</strong> Full access, can manage team
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-3 h-3 text-blue-500" />
                        <span>
                          <strong>Editor:</strong> Can view and edit documents
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-3 h-3 text-gray-500" />
                        <span>
                          <strong>Viewer:</strong> Can only view documents
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
