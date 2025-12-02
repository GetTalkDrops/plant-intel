"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconSettings,
  IconMap,
  IconChartBar,
  IconUser,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnalyzerConfigEditor } from "@/components/admin";

// Mock customer data
const mockCustomers: Record<string, any> = {
  "customer-1": {
    id: "customer-1",
    name: "Acme Manufacturing",
    email: "contact@acme-mfg.com",
    status: "active",
    plan: "pilot",
    startDate: "2025-01-15",
    mappingProfiles: 3,
    analyses: 12,
    lastActivity: "2025-01-20T10:30:00Z",
    contactName: "John Smith",
    phone: "(555) 123-4567",
    address: "123 Industrial Pkwy, Manufacturing City, MC 12345",
    notes: "Pilot customer focusing on cost analysis. $50k savings guarantee.",
  },
};

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  const customer = mockCustomers[customerId];

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4 lg:px-6">
        <h2 className="text-2xl font-bold mb-2">Customer Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The customer you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link href="/admin/customers">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/customers">
              <IconArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold truncate">{customer.name}</h2>
              {getStatusBadge(customer.status)}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>{customer.email}</span>
              <span>•</span>
              <span className="capitalize">{customer.plan} Plan</span>
              <span>•</span>
              <span>Started {formatDate(customer.startDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <IconUser className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="maps">
            <IconMap className="mr-2 h-4 w-4" />
            Mapping Profiles
          </TabsTrigger>
          <TabsTrigger value="analyses">
            <IconChartBar className="mr-2 h-4 w-4" />
            Analyses
          </TabsTrigger>
          <TabsTrigger value="config">
            <IconSettings className="mr-2 h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Contact Name</div>
                  <div className="font-medium">{customer.contactName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Email</div>
                  <div className="font-medium">{customer.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Phone</div>
                  <div className="font-medium">{customer.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Address</div>
                  <div className="font-medium">{customer.address}</div>
                </div>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-3xl font-bold">{customer.mappingProfiles}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Mapping Profiles
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-3xl font-bold">{customer.analyses}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Total Analyses
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Last Activity</div>
                  <div className="font-medium">
                    {formatDate(customer.lastActivity)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Internal notes about this customer</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{customer.notes}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mapping Profiles Tab */}
        <TabsContent value="maps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Mapping Profiles</CardTitle>
              <CardDescription>
                Manage this customer's CSV mapping configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">Mapping profiles management coming soon</p>
                <Button asChild>
                  <Link href="/dashboard/maps">View All Maps</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analyses Tab */}
        <TabsContent value="analyses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis History</CardTitle>
              <CardDescription>
                View all analyses run for this customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">Analysis history coming soon</p>
                <Button asChild>
                  <Link href="/dashboard">View Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <AnalyzerConfigEditor
            customerId={customerId}
            onSave={(config) => {
              console.log("Saving config for", customerId, config);
              // TODO: Save to Supabase
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
