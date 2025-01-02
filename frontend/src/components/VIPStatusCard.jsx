const VIPStatusCard = ({ vip }) => {
  const timeRemaining = new Date(vip.enddate) - new Date();
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <Card>
      <CardContent className="p-6">
        <p className="font-medium">Status: Active VIP</p>
        <p>Expires in: {days} days, {hours} hours</p>
        <p>Started: {new Date(vip.timestamp).toLocaleDateString()}</p>
        <p>Added by: {vip.admin_playername}</p>
      </CardContent>
    </Card>
  );
};