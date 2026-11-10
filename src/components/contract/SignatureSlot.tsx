export default function SignatureSlot({
  role,
  name,
  children,
}: {
  role: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-[88px] w-full items-end justify-center pb-1">
        {children}
      </div>
      <p className="mt-1 text-sm font-bold text-[#111e3f]">{role}</p>
      <p className="mt-0.5 text-xs text-[#64748b]">{name}</p>
    </div>
  );
}
