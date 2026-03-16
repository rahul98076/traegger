import React, { useState, useEffect } from 'react';
import { 
  Users, Database, Cloud, History, Trash2, 
  Settings, UserPlus, ShieldAlert, LogOut, RefreshCw,
  Download, Upload, Search, ShieldCheck, UserX, Key
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import AuditLog from './AuditLog';
import { fetchAuditLogs, forceFirebaseSync, exportDatabase, importDatabase } from '@/api/admin';
import { fetchAllUsers, updateUser, resetUserPassword, forceLogoutUser, createUser } from '@/api/users';
import { fetchOrders, restoreOrder } from '@/api/orders';
import useAuthStore from '@/store/authStore';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("users");
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const currentUser = useAuthStore(state => state.user);

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async () => {
    try {
      setSyncing(true);
      await forceFirebaseSync();
      toast.success("Full Firebase sync triggered successfully");
    } catch (err) {
      toast.error("Failed to trigger Firebase sync");
    } finally {
      setSyncing(false);
    }
  };


  const handleCloudRestore = async () => {
    if (!window.confirm("WARNING: This will completely wipe your local database and replace it with data from the cloud. Continue?")) return;
    
    try {
      setSyncing(true);
      await restoreFromCloud();
      toast.success("Database successfully restored from Cloud!");
      // Reload the page to refresh all app state cleanly
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error("Failed to restore from Cloud", {
        description: err.response?.data?.detail || err.message,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportDatabase();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pennys_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Database exported successfully");
    } catch (err) {
      toast.error("Failed to export database");
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm("Are you sure? This will add records from the backup file. Overwriting isn't supported yet, but duplicates might be skipped.")) {
      return;
    }

    try {
      await importDatabase(file);
      toast.success("Database import triggered successfully");
    } catch (err) {
      toast.error("Failed to import database");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-slate-700" />
            Admin Settings
          </h1>
          <p className="text-slate-500 mt-1">Manage users, backups, and system audit logs.</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 border-slate-200">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="backups" className="flex items-center gap-2">
            <Database className="h-4 w-4" /> Backups
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" /> Cloud Sync
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" /> Audit Log
          </TabsTrigger>
          <TabsTrigger value="deleted" className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-4 w-4" /> Deleted
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>User Accounts</CardTitle>
                <CardDescription>Manage staff access and permissions.</CardDescription>
              </div>
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="h-4 w-4 mr-2" /> Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                   <DialogHeader>
                      <DialogTitle>Create New Staff Account</DialogTitle>
                      <DialogDescription>Assign a role and set initial credentials.</DialogDescription>
                   </DialogHeader>
                   <AddUserForm onUserAdded={() => { setIsUserDialogOpen(false); loadUsers(); }} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <UsersTable users={users} loading={loading} onRefresh={loadUsers} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Local Backups</CardTitle>
              <CardDescription>Export your entire database to a JSON file for safe keeping.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 flex flex-col items-center text-center space-y-3">
                  <Download className="h-10 w-10 text-blue-500" />
                  <div className="space-y-1">
                    <p className="font-semibold">Export Database</p>
                    <p className="text-xs text-slate-500">Download all customers, menu items, and orders as a single file.</p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleExport}>Download JSON</Button>
                </div>
                <div className="p-4 border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 flex flex-col items-center text-center space-y-3">
                  <Upload className="h-10 w-10 text-amber-500" />
                  <div className="space-y-1">
                    <p className="font-semibold">Restore Data</p>
                    <p className="text-xs text-slate-500">Upload a previously exported backup file to restore records.</p>
                  </div>
                  <div className="relative w-full">
                    <Button variant="outline" className="w-full text-amber-600 border-amber-200 hover:bg-amber-50">Upload File</Button>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept=".json"
                      onChange={handleImport}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Firebase Cloud Mirror</CardTitle>
              <CardDescription>Monitor and manage real-time synchronization to Firestore.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 border ">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12  flex items-center justify-center ${syncing ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                      <Cloud className={`h-6 w-6 ${syncing ? 'text-amber-600 animate-pulse' : 'text-emerald-600'}`} />
                    </div>
                    <div>
                      <p className="font-semibold">Local to Cloud: Push</p>
                      <p className="text-sm text-slate-500">Overwrites cloud data with your local database.</p>
                    </div>
                  </div>
                  <Button className="gap-2" onClick={handleForceSync} disabled={syncing}>
                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> 
                    {syncing ? 'Pushing Data...' : 'Force Push to Cloud'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 dark:bg-red-950/20">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 flex items-center justify-center bg-red-100 dark:bg-red-900 rounded-full">
                      <Download className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400">Cloud to Local: Restore</p>
                      <p className="text-sm text-red-600 dark:text-red-500">Wipes local database and replaces it with the latest cloud data.</p>
                    </div>
                  </div>
                  <Button className="gap-2" variant="destructive" onClick={handleCloudRestore} disabled={syncing}>
                    <Download className={`h-4 w-4 ${syncing ? 'animate-bounce' : ''}`} /> 
                    {syncing ? 'Restoring...' : 'Restore from Cloud'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
           <AuditLog />
        </TabsContent>

        <TabsContent value="deleted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Bin</CardTitle>
              <CardDescription>Recently deleted orders can be restored here.</CardDescription>
            </CardHeader>
            <CardContent>
              <DeletedOrdersTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTable({ users, loading, onRefresh }) {
  if (loading) return <div className="py-12 text-center text-slate-500">Loading user database...</div>;

  return (
    <div className=" border">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-50 dark:bg-slate-900">
          <tr>
            <th className="px-6 py-3">User</th>
            <th className="px-6 py-3">Role</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className="dark:bg-slate-800 bg-white hover:bg-slate-50 dark:hover:bg-slate-700">
              <td className="px-6 py-4 font-medium flex items-center gap-3">
                <div className="h-8 w-8  bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200">
                  {user.username[0].toUpperCase()}
                </div>
                {user.username}
              </td>
              <td className="px-6 py-4">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                  {user.role}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <Badge variant={user.is_active ? 'success' : 'destructive'} className="bg-emerald-100 text-emerald-700 border-none">
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-6 py-4 text-right space-x-2">
                <Button 
                   variant="ghost" 
                   size="sm" 
                   title="Force Logout"
                   onClick={() => confirm("End this user's session?") && forceLogoutUser(user.id).then(() => onRefresh())}
                >
                  <LogOut className="h-4 w-4 text-slate-400" />
                </Button>
                <Button 
                   variant="ghost" 
                   size="sm"
                   title="Reset Password"
                   onClick={() => {
                     const pass = prompt("Enter new password:");
                     if (pass) resetUserPassword(user.id, pass).then(() => toast.success("Password reset"));
                   }}
                >
                  <Key className="h-4 w-4 text-slate-400" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddUserForm({ onUserAdded }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createUser({ username, password, role });
      toast.success("User created successfully");
      onUserAdded();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Username</Label>
        <Input required value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. rahul_admin" />
      </div>
      <div className="space-y-2">
        <Label>Initial Password</Label>
        <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="staff">Staff Member</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating..." : "Confirm & Create"}
      </Button>
    </form>
  );
}

function DeletedOrdersTable() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeleted();
  }, []);

  const loadDeleted = async () => {
    try {
      setLoading(true);
      const data = await fetchOrders({ status: 'deleted' });
      setOrders(data);
    } catch (err) {
      toast.error("Failed to load deleted orders");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreOrder(id);
      toast.success("Order restored successfully");
      loadDeleted();
    } catch (err) {
      toast.error("Failed to restore order");
    }
  };

  if (loading) return <div className="py-8 text-center text-slate-500 text-sm">Scanning recovery bin...</div>;

  return (
    <div className="text-sm">
      <div className="divide-y">
        {orders.map(order => (
          <div key={order.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-semibold">Order #{order.id} • {order.customer_name}</p>
              <p className="text-xs text-slate-500">Deleted: {new Date(order.updated_at).toLocaleDateString()}</p>
            </div>
            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-100 hover:bg-emerald-50" onClick={() => handleRestore(order.id)}>
              <RefreshCw className="h-3 w-3 mr-2" /> Restore
            </Button>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="py-8 text-center text-slate-400 italic">No deleted orders found.</div>
        )}
      </div>
    </div>
  );
}
