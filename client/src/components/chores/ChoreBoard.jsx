import ChoreCard from './ChoreCard.jsx';

export default function ChoreBoard({ chores, groups, onUpdate, onDelete }) {
  const byGroup = {};
  chores?.forEach((c) => {
    const gid = c.group_id?._id || c.group_id;
    if (!byGroup[gid]) byGroup[gid] = [];
    byGroup[gid].push(c);
  });

  return (
    <div className="space-y-6">
      {Object.entries(byGroup).map(([gid, list]) => {
        const group = groups?.find((g) => g._id === gid);
        return (
          <div key={gid}>
            <h3 className="font-semibold text-lg mb-2">{group?.name || 'Unknown'}</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => (
                <ChoreCard key={c._id} chore={c} onUpdate={onUpdate} onDelete={onDelete} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
