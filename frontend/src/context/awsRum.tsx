import { AwsRum, AwsRumConfig } from 'aws-rum-web';
import { createContext, ReactNode, useMemo, useRef } from 'react';
import { useEffectOnce } from 'react-use';

import { CloudwatchRumConfig } from '@/utils/rum';

interface AwsRumContextValue {
  awsRum?: AwsRum;
  config?: CloudwatchRumConfig;
}

const AwsRumContext = createContext<AwsRumContextValue | null>(null);

interface AwsRumProviderProps {
  children: ReactNode;
  config?: CloudwatchRumConfig;
}

export function AwsRumProvider({ children, config }: AwsRumProviderProps) {
  const awsRumRef = useRef<AwsRum>();

  useEffectOnce(() => {
    if (!config) {
      return;
    }

    try {
      const awsRumConfig: AwsRumConfig = {
        sessionSampleRate: 1,
        guestRoleArn: config.role_arn,
        identityPoolId: config.identity_pool_id,
        endpoint: 'https://dataplane.rum.us-west-2.amazonaws.com',
        telemetries: ['performance', 'errors', 'http'],
        allowCookies: false,
        enableXRay: false,
      };

      const APPLICATION_VERSION = '1.0.0';
      const APPLICATION_REGION = 'us-west-2';

      awsRumRef.current = new AwsRum(
        config.app_id,
        APPLICATION_VERSION,
        APPLICATION_REGION,
        awsRumConfig,
      );
    } catch (error) {
      // Ignore errors thrown during CloudWatch RUM web client initialization
    }
  });

  const value = useMemo<AwsRumContextValue>(
    () => ({
      config,
      awsRum: awsRumRef.current,
    }),
    [config],
  );

  return (
    <AwsRumContext.Provider value={value}>{children}</AwsRumContext.Provider>
  );
}
