'use client';

import { PageHeader } from '@/components/atoms/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import businessProfileState from '@/data/states/businessProfile.json';
import businessProfileStrings from '@/data/strings/businessProfile.json';

export default function BusinessProfile() {
  const router = useRouter();
  const { profile } = businessProfileState;
  const strings = businessProfileStrings;

  const handleEditProfile = () => {
    router.push('/business-profile');
  };

  return (
    <>
      <PageHeader 
        title={strings.header.title}
        description="Manage your business information and settings"
        action={
          <Button onClick={handleEditProfile}>
            {strings.header.editButton}
          </Button>
        }
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{strings.fields.legalBusinessName}</Label>
              <p className="text-muted-foreground">
                {profile.legalBusinessName || 'Not set'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{strings.fields.industry}</Label>
              <p className="text-muted-foreground">
                {profile.industry || 'Not set'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{strings.fields.companyEmail}</Label>
              <p className="text-muted-foreground">
                {profile.companyEmail || 'Not set'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{strings.fields.countryOfOperation}</Label>
              <p className="text-muted-foreground">
                {profile.countryOfOperation || 'Not set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}