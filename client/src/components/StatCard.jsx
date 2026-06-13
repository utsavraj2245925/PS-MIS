export default function StatCard({
  title,
  value,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
      <h3 className="text-slate-500 text-sm">
        {title}
      </h3>

      <p className="text-3xl font-bold mt-2">
        {value}
      </p>
    </div>
  );
}