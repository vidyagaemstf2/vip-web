import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CirclePlus,
  CircleMinus,
  Timer,
  TimerOff,
  ArrowRightCircle,
  CalendarClock,
} from "lucide-react";

const API_BASE_URL = "http://localhost:3000/api/vips";

const ActionIcon = ({ type }) => {
  const getIconProps = (colorClass: string) => ({
    className: `w-5 h-5 ${colorClass}`,
    strokeWidth: 1.5,
  });

  switch (type) {
    case "add":
      return <CirclePlus {...getIconProps("text-green-500")} />;
    case "remove":
      return <CircleMinus {...getIconProps("text-red-500")} />;
    case "extend":
      return <Timer {...getIconProps("text-blue-500")} />;
    case "expire":
      return <TimerOff {...getIconProps("text-orange-500")} />;
    default:
      return <ArrowRightCircle {...getIconProps("text-gray-500")} />;
  }
};

const formatDuration = (duration, durationType) => {
  if (!duration) return "";
  return `${duration} ${durationType.toLowerCase()}${duration > 1 ? "s" : ""}`;
};

const LogsView = ({ isAdmin }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/logs`, {
          // Changed from /vip-logs to /logs
          credentials: "include",
        });

        if (!response.ok) throw response;
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        setError("Failed to fetch logs");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) return <div className="text-center py-4">Loading logs...</div>;
  if (error)
    return <div className="text-red-500 text-center py-4">{error}</div>;

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <CalendarClock className="w-5 h-5 mr-2" />
          <h2 className="text-xl font-semibold">Activity Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                {isAdmin && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  When
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <ActionIcon type={log.action_type} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="capitalize">{log.action_type}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <a
                      href={`https://steamcommunity.com/profiles/${log.target_steamid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {log.target_name}
                    </a>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-4 whitespace-nowrap">
                      <a
                        href={`https://steamcommunity.com/profiles/${log.admin_steamid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {log.admin_name}
                      </a>
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {formatDuration(log.duration, log.duration_type)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogsView;
