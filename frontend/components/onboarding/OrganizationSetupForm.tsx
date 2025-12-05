'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface OrganizationSetupFormProps {
  onComplete?: () => void;
}

export function OrganizationSetupForm({ onComplete }: OrganizationSetupFormProps) {
  const router = useRouter();
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    company_size: '',
    industry: 'manufacturing',
    annual_revenue_range: '',
    phone: '',
    address: '',
    contact_name: '',
    contact_email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.setupOrganization(formData);

      if (response.success) {
        toast.success('Organization setup complete!');

        if (onComplete) {
          onComplete();
        } else {
          // Redirect to dashboard
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Organization setup failed:', error);
      toast.error(error.message || 'Failed to setup organization');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);

    try {
      await apiClient.skipOnboarding();
      toast.success('Onboarding skipped');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Failed to skip onboarding:', error);
      toast.error(error.message || 'Failed to skip onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Welcome to Plant Intel</CardTitle>
        <CardDescription>
          Let's get your organization set up so you can start analyzing your manufacturing data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company_name">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Acme Manufacturing Inc."
              required
            />
          </div>

          {/* Company Size */}
          <div className="space-y-2">
            <Label htmlFor="company_size">
              Company Size <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.company_size}
              onValueChange={(value) => setFormData({ ...formData, company_size: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-50">1-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-500">201-500 employees</SelectItem>
                <SelectItem value="501-1000">501-1000 employees</SelectItem>
                <SelectItem value="1001+">1001+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Annual Revenue Range */}
          <div className="space-y-2">
            <Label htmlFor="annual_revenue_range">Annual Revenue Range</Label>
            <Select
              value={formData.annual_revenue_range}
              onValueChange={(value) => setFormData({ ...formData, annual_revenue_range: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select revenue range (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="<10M">Less than $10M</SelectItem>
                <SelectItem value="10M-50M">$10M - $50M</SelectItem>
                <SelectItem value="50M-100M">$50M - $100M</SelectItem>
                <SelectItem value="100M-200M">$100M - $200M</SelectItem>
                <SelectItem value="200M+">$200M+</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This helps us understand your organization better
            </p>
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select
              value={formData.industry}
              onValueChange={(value) => setFormData({ ...formData, industry: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="aerospace">Aerospace</SelectItem>
                <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                <SelectItem value="pharmaceutical">Pharmaceutical</SelectItem>
                <SelectItem value="metal-fabrication">Metal Fabrication</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="john@acme.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Company Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip for now
            </Button>

            <Button type="submit" disabled={loading || !formData.company_name || !formData.company_size}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
