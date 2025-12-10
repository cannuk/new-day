import React from 'react';
import { Box, Button, Heading, Text } from '@theme-ui/components';
import { signInWithGoogle } from '../../hooks/useAuth';

export const Login: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 4,
        bg: 'background',
      }}
    >
      <Heading as="h1" mb={3} sx={{ color: 'text' }}>
        New Day
      </Heading>
      <Text mb={4} sx={{ color: 'secondary' }}>
        Sign in to sync your tasks across devices
      </Text>

      <Button
        onClick={handleLogin}
        disabled={isLoading}
        sx={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
      >
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </Button>

      {error && (
        <Text mt={3} sx={{ color: 'red' }}>
          {error}
        </Text>
      )}
    </Box>
  );
};
