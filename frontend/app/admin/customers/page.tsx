"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconSearch, IconUser, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Mock customer data - will be replaced with Supabase query
const mockCustomers = [
  {
    id: "customer-1",
    name: "Acme Manufacturing",
    email: "contact@acme-mfg.com",
    status: "active" as const,
    plan: "pilot",
    startDate: "2025-01-15",
    mappingProfiles: 3,
    analyses: 12,
    lastActivity: "2025-01-20T10:30:00Z",
  },
  {
    id: "customer-2",
    name: "TechCorp Industries",
    email: "admin@techcorp.com",
    status: "active" as const,
    plan: "subscription",
    startDate: "2024-12-01",
    mappingProfiles: 5,
    analyses: 28,
    lastActivity: "2025-01-19T14:20:00Z",
  },
  {
    id: "customer-3",
    name: "Global Parts Co",
    email: "ops@globalparts.com",
    status: "trial" as const,
    plan: "pilot",
    startDate: "2025-01-10",
    mappingProfiles: 2,
    analyses: 5,
    lastActivity: "2025-01-18T09:15:00Z",
  },
];

export default function AdminCustomersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredCustomers = React.useMemo(() => {
    if (!searchQuery.trim()) return mockCustomers;
    const query = searchQuery.toLowerCase();
    return mockCustomers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "trial":
        return <Badge variant="secondary">Trial</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground">
            Manage pilot customers and subscription accounts
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/customers/new">
            <IconPlus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => router.push(`/admin/customers/${customer.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <IconUser className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{customer.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {customer.email}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(customer.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Plan & Start Date */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium capitalize">{customer.plan}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">{formatDate(customer.startDate)}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{customer.mappingProfiles}</div>
                    <div className="text-xs text-muted-foreground">Maps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{customer.analyses}</div>
                    <div className="text-xs text-muted-foreground">Analyses</div>
                  </div>
                </div>

                {/* Last Activity */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Last activity: {formatLastActivity(customer.lastActivity)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          {searchQuery ? (
            <>
              <h3 className="text-lg font-semibold mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-4">
                No customers match "{searchQuery}"
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first customer to get started
              </p>
              <Button asChild>
                <Link href="/admin/customers/new">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Customer
                </Link>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
