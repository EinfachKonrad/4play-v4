import React from 'react';
import { usePermissions } from '../../hooks/usePermission';
import { Shield } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';
import Head from 'next/head';
import useInstanceConfig from '@/hooks/useInstanceConfig';

interface ProtectedPageProps {
    children: React.ReactNode;
    permission: string;
    fallback?: React.ReactElement;
    pageTitle: string;
}

export const ProtectedPage: React.FC<ProtectedPageProps> = ({ 
  children, 
  permission, 
  fallback, 
  pageTitle
}) => {
  const { status } = useSession();
  const permissions = usePermissions();
  const instanceConfig = useInstanceConfig();

  if (status === 'loading') {
    return (
      <Spinner />
    );
  }

  if (!permissions.includes(permission) && !permissions.includes("*")) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="h-full m-auto flex flex-col items-center justify-center h-64 text-center">
        <div className="bg-red-900/20 p-6 rounded-lg border border-red-800 max-w-md">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Zugriff verweigert</h2>
          <p className="text-gray-300 mb-2">
            Sie haben keine Berechtigung, auf diese Seite zuzugreifen.
          </p>
            <Button onClick={() => window.history.back()}>
              Zurück
            </Button>
        </div>
      </div>
    );
  }

  return (
    <>
        <Head>
            <title>{pageTitle ? `${pageTitle}` : ""} &bull; {instanceConfig?.name ?? "4play"}</title>
        </Head>
        {children}
    </>);
};

export default ProtectedPage;