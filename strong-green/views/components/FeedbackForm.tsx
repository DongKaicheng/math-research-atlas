export default function FeedbackForm({ entryId, revision }: {entryId?:string;revision?:string}) {
  const context=new URLSearchParams({project:"strong-green"});
  if(entryId)context.set("entry",entryId);
  if(revision)context.set("version",revision);
  return <section className="feedback-section" id="feedback">
    <h2>Questions, corrections and suggestions</h2>
    <p>Discuss this record in the atlas’s shared feedback board. The record and edition are carried into the form; general suggestions can be sent without them.</p>
    <p>GitHub Issues and attachments are public. A contribution starts a discussion, not an automatic change to the mathematics.</p>
    <div className="hero-actions"><a className="button" href={"/atlas-feedback/?"+context.toString()}>Discuss this record</a><a className="text-link" href="/atlas-feedback/guide/">Feedback and LaTeX uploads</a></div>
  </section>;
}
