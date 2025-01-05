import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../contexts/AuthContext";
import LogsView from "./LogsView";

const API_BASE_URL = "http://localhost:3000";
const API_VIP_URL = `${API_BASE_URL}/api/vips`;

const VIPDashboard = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [vips, setVips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingVip, setEditingVip] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendVip, setExtendVip] = useState(null);
  const [extendDuration, setExtendDuration] = useState({
    duration: 1,
    timeFormat: "MONTH",
  });

  const [newVip, setNewVip] = useState({
    steamid: "",
    name: "",
    duration: 1,
    timeFormat: "MONTH",
  });

  const { user, isAdmin } = useAuth();

  const handleApiError = (error) => {
    if (error.status === 401) {
      // Handle not authenticated
      window.location.href = `${API_BASE_URL}/auth/steam`;
    } else if (error.status === 403) {
      // Handle not authorized
      setError("You do not have permission to perform this action");
    } else {
      setError(error.message);
    }
  };

  const fetchVips = async () => {
    try {
      const response = await fetch(API_VIP_URL, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();
      setVips(data);
      setError(null);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVips();
  }, []);

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  // Auth checks after loading
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl mb-4">Welcome to VIP Management</h2>
        <a
          href="http://localhost:3000/auth/steam"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Login with Steam
        </a>
      </div>
    );
  }

  const DashboardHeader = ({ user, onLogout }) => (
    <CardHeader className="bg-gray-50 border-b flex justify-between items-center">
      <div>
        <CardTitle className="text-2xl font-semibold">
          VIPs Vidya Gaems
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Welcome, {user?.displayName || "Guest"}
        </p>
      </div>
      {user && (
        <Button variant="outline" size="sm" onClick={onLogout}>
          Logout
        </Button>
      )}
    </CardHeader>
  );

  // VIP Status Card component
  const VipStatusCard = ({ vip }) => {
    const timeRemaining = new Date(vip.enddate) - new Date();
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    return (
      <Card>
        <CardContent className="p-6">
          <p className="font-medium">Status: Active VIP</p>
          <p>
            Expires in: {days} days, {hours} hours
          </p>
          <p>Started: {new Date(vip.timestamp).toLocaleDateString()}</p>
          <p>Added by: {vip.admin_playername}</p>
        </CardContent>
      </Card>
    );
  };

  const handleLogout = () => {
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).then(() => {
      window.location.href = "/";
    });
  };

  if (!isAdmin) {
    return (
      <Card className="w-[1000px] shadow-lg">
        <DashboardHeader user={user} onLogout={handleLogout} />
        <CardContent className="p-6">
          <h2 className="text-2xl mb-4">Your VIP Status</h2>
          {vips.find((vip) => vip.playerid === user.id) ? (
            <VipStatusCard vip={vips.find((vip) => vip.playerid === user.id)} />
          ) : (
            <p>You don't have VIP status.</p>
          )}
          <LogsView isAdmin={false} />
        </CardContent>
      </Card>
    );
  }

  const handleEdit = async (vip) => {
    try {
      const response = await fetch(`${API_VIP_URL}/${vip.playerid}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playername: editingVip.playername,
          enddate: editingVip.enddate,
          admin_playername: user.displayName,
          admin_playerid: user.id,
        }),
      });

      if (!response.ok) {
        throw response;
      }

      await fetchVips();
      setShowEditModal(false);
      setEditingVip(null);
      setError(null);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleExtend = async (vip) => {
    try {
      const response = await fetch(`${API_VIP_URL}/${vip.playerid}/extend`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duration: parseInt(extendDuration.duration),
          timeFormat: extendDuration.timeFormat,
          admin_playername: user.displayName,
          admin_playerid: user.id,
        }),
      });

      if (!response.ok) {
        throw response;
      }

      await fetchVips();
      setShowExtendModal(false);
      setExtendVip(null);
      setError(null);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleAddVip = async () => {
    try {
      const response = await fetch(API_VIP_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playername: newVip.name,
          playerid: newVip.steamid,
          admin_playername: user.displayName, // Use actual admin name from auth
          admin_playerid: user.id, // Use actual admin ID from auth
          duration: parseInt(newVip.duration),
          timeFormat: newVip.timeFormat,
        }),
      });

      if (!response.ok) {
        throw response;
      }

      await fetchVips();
      setNewVip({ steamid: "", name: "", duration: 1, timeFormat: "MONTH" });
      setError(null);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleRemoveVip = async (playerid) => {
    try {
      const response = await fetch(`${API_VIP_URL}/${playerid}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw response;
      }

      await fetchVips();
      setError(null);
    } catch (err) {
      handleApiError(err);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card className="w-[1000px] shadow-lg">
        <DashboardHeader user={user} onLogout={handleLogout} />
        <CardContent className="p-0">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-0">
            <button
              onClick={() => setActiveTab("list")}
              className={`py-2 px-4 text-center ${
                activeTab === "list"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                List VIPs
              </div>
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`py-2 px-4 text-center ${
                activeTab === "add"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add VIP
              </div>
            </button>
          </div>

          <div className="p-6">
            {activeTab === "list" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Remaining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vips.map((vip) => {
                      const timeRemaining = new Date(vip.enddate) - new Date();
                      const days = Math.floor(
                        timeRemaining / (1000 * 60 * 60 * 24)
                      );
                      const hours = Math.floor(
                        (timeRemaining % (1000 * 60 * 60 * 24)) /
                          (1000 * 60 * 60)
                      );
                      const minutes = Math.floor(
                        (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
                      );

                      let timeDisplay = "";
                      let timeColor = "";

                      if (days > 0) {
                        timeDisplay = `${days} days ${hours}h`;
                        timeColor =
                          days <= 7 ? "text-yellow-600" : "text-green-600";
                      } else if (hours > 0) {
                        timeDisplay = `${hours}h ${minutes}m`;
                        timeColor = "text-orange-600";
                      } else {
                        timeDisplay = `${minutes}m`;
                        timeColor = "text-red-600";
                      }

                      const steamProfileUrl = `https://steamcommunity.com/profiles/${vip.playerid}`;

                      return (
                        <tr key={vip.Id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a
                              href={steamProfileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {vip.playername}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(vip.timestamp).toLocaleDateString()}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap font-medium ${timeColor}`}
                          >
                            {timeDisplay}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-blue-50"
                              onClick={() => {
                                setEditingVip(vip);
                                setShowEditModal(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-green-50"
                              onClick={() => {
                                setExtendVip(vip);
                                setShowExtendModal(true);
                              }}
                            >
                              Extend
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveVip(vip.playerid)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <LogsView isAdmin={true} />
              </div>
            )}

            {activeTab === "add" && (
              <div className="max-w-md mx-auto space-y-4">
                <Input
                  placeholder="Steam ID (e.g., 0:1:12345678)"
                  value={newVip.steamid}
                  onChange={(e) =>
                    setNewVip({ ...newVip, steamid: e.target.value })
                  }
                />
                <Input
                  placeholder="Player Name"
                  value={newVip.name}
                  onChange={(e) =>
                    setNewVip({ ...newVip, name: e.target.value })
                  }
                />
                <div className="flex gap-4">
                  <Input
                    type="number"
                    min="1"
                    value={newVip.duration}
                    onChange={(e) =>
                      setNewVip({ ...newVip, duration: e.target.value })
                    }
                    className="flex-1"
                  />
                  <select
                    value={newVip.timeFormat}
                    onChange={(e) =>
                      setNewVip({ ...newVip, timeFormat: e.target.value })
                    }
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="MONTH">Months</option>
                    <option value="MINUTE">Minutes</option>
                  </select>
                </div>
                <Button
                  onClick={handleAddVip}
                  className="w-full"
                  disabled={!newVip.steamid || !newVip.name}
                >
                  Add VIP
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showEditModal && editingVip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4">Edit VIP</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Player Name
                </label>
                <Input
                  value={editingVip.playername}
                  onChange={(e) =>
                    setEditingVip({
                      ...editingVip,
                      playername: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <DatePicker
                  selected={new Date(editingVip.enddate)}
                  onChange={(date) =>
                    setEditingVip({
                      ...editingVip,
                      enddate: date,
                    })
                  }
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date()}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingVip(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => handleEdit(editingVip)}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExtendModal && extendVip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4">Extend VIP Duration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Extending VIP status for: {extendVip.playername}
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={extendDuration.duration}
                    onChange={(e) =>
                      setExtendDuration({
                        ...extendDuration,
                        duration: e.target.value,
                      })
                    }
                    className="flex-1"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Unit
                  </label>
                  <select
                    value={extendDuration.timeFormat}
                    onChange={(e) =>
                      setExtendDuration({
                        ...extendDuration,
                        timeFormat: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="MONTH">Months</option>
                    <option value="MINUTE">Minutes</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExtendModal(false);
                    setExtendVip(null);
                    setExtendDuration({ duration: 1, timeFormat: "MONTH" });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => handleExtend(extendVip)}>
                  Extend VIP
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VIPDashboard;
