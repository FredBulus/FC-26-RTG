export function PageTitle({
  eyebrow,
  title,
  children
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      {eyebrow ? (
        <p className="mb-2 text-sm font-black uppercase tracking-[0.24em] text-gold">{eyebrow}</p>
      ) : null}
      <h1 className="text-3xl font-black tracking-normal text-ink sm:text-5xl">{title}</h1>
      {children ? <div className="mt-3 max-w-3xl text-base font-medium text-ink/70">{children}</div> : null}
    </section>
  );
}
