export default function Background({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-svh items-center justify-center bg-unauth text-white">
      <div className="absolute inset-0 bg-black/10" />
      {children}
    </div>
  );
}
