// Renders comment text with highlighted @mentions.
export default function RenderText({ text }) {
  const parts = text.split(/(@\w+)/g)
  return (
    <>
      {parts.map((part, i) =>
        /^@\w+$/.test(part)
          ? <span key={i} className="text-indigo-600 font-medium bg-indigo-50 rounded px-0.5">{part}</span>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}
