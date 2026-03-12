"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { getInitials, formatDate } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

export default function ScholarsPage() {
  const [scholars, setScholars] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadScholars();
  }, []);

  async function loadScholars() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: appUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authUser.id)
      .single();

    if (!appUser) return;

    const { data: prof } = await supabase
      .from("professors")
      .select("id")
      .eq("user_id", appUser.id)
      .single();

    if (!prof) {
      // Try co-supervisor
      const { data: coSup } = await supabase
        .from("co_supervisors")
        .select("professor_id")
        .eq("user_id", appUser.id)
        .single();

      if (coSup) {
        const { data } = await supabase
          .from("scholars")
          .select("*, user:users(*)")
          .eq("professor_id", coSup.professor_id)
          .order("joining_date", { ascending: false });
        setScholars(data || []);
      }
    } else {
      const { data } = await supabase
        .from("scholars")
        .select("*, user:users(*)")
        .eq("professor_id", prof.id)
        .order("joining_date", { ascending: false });
      setScholars(data || []);
    }

    setLoading(false);
  }

  const filtered = scholars.filter(
    (s) =>
      s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.research_topic?.toLowerCase().includes(search.toLowerCase())
  );

  const statusVariant = (status: string) => {
    switch (status) {
      case "active": return "success" as const;
      case "inactive": return "secondary" as const;
      case "graduated": return "info" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scholars</h1>
          <p className="text-muted-foreground">Manage your research scholars</p>
        </div>
        <Link href="/dashboard/scholars/add">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            Add Scholar
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search scholars..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {search ? "No scholars match your search" : "No scholars added yet"}
            </p>
            {!search && (
              <Link href="/dashboard/scholars/add">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add your first scholar
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((scholar) => (
            <Link key={scholar.id} href={`/dashboard/scholars/${scholar.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(scholar.user?.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate">{scholar.user?.name}</h3>
                        <Badge variant={statusVariant(scholar.status)}>
                          {scholar.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {scholar.user?.email}
                      </p>
                      <p className="text-sm mt-2 truncate">
                        {scholar.research_topic || "No research topic set"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Joined {formatDate(scholar.joining_date)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
