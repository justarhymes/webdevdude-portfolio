export default function Tag({ children }: { children: React.ReactNode }) {
  return (
    <li className='bg-card-500 text-blackcoral-500 p-2 shadow'>{children}</li>
  );
}
