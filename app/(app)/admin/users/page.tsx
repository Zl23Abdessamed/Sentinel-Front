"use client";

import { useEffect, useState } from "react";
import { sentinel, Department, User } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Plus, Loader2 } from "lucide-react";
import { Topbar } from "@/components/nav/Topbar";

export default function AdminUsersPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newDeptName, setNewDeptName] = useState("");
  const [creatingDept, setCreatingDept] = useState(false);
  
  const [newWorker, setNewWorker] = useState({ name: "", email: "", password: "", department_id: "" });
  const [creatingWorker, setCreatingWorker] = useState(false);

  const fetchData = async () => {
    try {
      const [deptRes, workerRes] = await Promise.all([
        sentinel.admin.listDepartments(),
        sentinel.admin.listWorkers()
      ]);
      setDepartments(deptRes.departments || []);
      setWorkers(workerRes.workers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingDept(true);
    try {
      await sentinel.admin.addDepartment(newDeptName);
      setNewDeptName("");
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
        setCreatingDept(false);
    }
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingWorker(true);
    try {
      await sentinel.admin.addWorker({
        ...newWorker,
        role: "WORKER",
      });
      setNewWorker({ name: "", email: "", password: "", department_id: "" });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
        setCreatingWorker(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center text-gray-400">Loading...</div>;
  }

  return (
    <>
      <Topbar
        title="Admin Settings"
        subtitle="MANAGE WORKERS AND DEPARTMENTS"
      />
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Organization Settings</h1>
          <p className="text-gray-400 mt-2">Manage your departments and workforce securely.</p>
        </div>

        <div className="flex flex-col gap-12">
          {/* Departments Panel */}
          <div className="space-y-4">
            <Card className="p-6 bg-[#0a0f18]/80 border-gray-800">
              <div className="flex items-center space-x-3 mb-6">
                <Building2 className="text-orange-500" />
                <h2 className="text-xl font-semibold text-gray-100">Departments</h2>
              </div>
              
              <form onSubmit={handleAddDepartment} className="flex gap-4 mb-8">
                <div className="flex-1 max-w-sm">
                  <input
                    required
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="New Department Name"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                <Button type="submit" disabled={creatingDept || !newDeptName} className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap">
                  {creatingDept ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add Department
                </Button>
              </form>

              <div className="overflow-x-auto rounded-lg border border-gray-800">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Department Name</th>
                      <th className="px-4 py-3 font-medium">Headcount</th>
                      <th className="px-4 py-3 font-medium">Department ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 bg-gray-900/30">
                    {departments.map((dept) => (
                      <tr key={dept.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-200">{dept.name}</td>
                        <td className="px-4 py-3">
                          {workers.filter((w) => w.department_id === dept.id).length} Employees
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{dept.id}</td>
                      </tr>
                    ))}
                    {departments.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          No departments configured yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Workers Panel */}
          <div className="space-y-4">
            <Card className="p-6 bg-[#0a0f18]/80 border-gray-800">
              <div className="flex items-center space-x-3 mb-6">
                <Users className="text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-100">Workforce</h2>
              </div>
              
              <form onSubmit={handleAddWorker} className="space-y-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Name</label>
                    <input
                      required
                      value={newWorker.name}
                      onChange={(e) => setNewWorker({...newWorker, name: e.target.value})}
                      placeholder="Employee Name"
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Email</label>
                    <input
                      required
                      type="email"
                      value={newWorker.email}
                      onChange={(e) => setNewWorker({...newWorker, email: e.target.value})}
                      placeholder="Email"
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Department</label>
                    <select
                      required
                      value={newWorker.department_id}
                      onChange={(e) => setNewWorker({...newWorker, department_id: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="" disabled>Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Temp Password</label>
                    <input
                      required
                      type="text"
                      value={newWorker.password}
                      onChange={(e) => setNewWorker({...newWorker, password: e.target.value})}
                      placeholder="Password"
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={creatingWorker || !newWorker.name || !newWorker.department_id} className="bg-blue-600 hover:bg-blue-700">
                    {creatingWorker ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Employee
                  </Button>
                </div>
              </form>

              <div className="overflow-x-auto rounded-lg border border-gray-800">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 bg-gray-900/30">
                    {workers.map((worker) => (
                      <tr key={worker.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-200">{worker.name || "-"}</td>
                        <td className="px-4 py-3 text-gray-400">{worker.email}</td>
                        <td className="px-4 py-3 text-blue-400">
                          {departments.find(d => d.id === worker.department_id)?.name || 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {workers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          No employees registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
