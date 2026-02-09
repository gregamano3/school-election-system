import AdminGroupsList from "./AdminGroupsList";

export default function AdminGroupsPage() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-black tracking-tight text-[#111418] dark:text-white">
        Voter groups
      </h1>
      <p className="mb-6 text-sm text-[#617289] dark:text-[#a1b0c3]">
        Create groups and assign voters to them. On each election you can choose which groups are allowed to vote.
      </p>
      <AdminGroupsList />
    </div>
  );
}
