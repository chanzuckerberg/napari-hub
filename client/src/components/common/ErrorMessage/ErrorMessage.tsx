interface Props {
  children: string;
  error?: string;
}

/**
 * Component for rendering basic error message.
 *
 * TODO Show better error page when designs are available
 */
export function ErrorMessage({ children, error }: Props) {
  return (
    <div className="flex flex-auto flex-col items-center justify-center mt-6 md:mt-12">
      <h1 className="font-bold text-4xl">Error: {children}</h1>
      <pre className="mt-6 md:mt-12">{error}</pre>
    </div>
  );
}
