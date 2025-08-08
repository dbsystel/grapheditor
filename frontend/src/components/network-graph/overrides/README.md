Note: we use Sigma.js v3.0.0-beta.38 at the time of writing this documentation file

In this directory you will find modified versions of Sigma.js nodes and relations renderers.
Long time ago, we talked about implementing square nodes. At that time, Sigma.js didn't offer
such possibility so we waited until it did.

But using square nodes package meant other things were broken, such as:
- straight and curved relation heads (arrows) were, when dragged around node, circling around the node, instead of following the
node's square shape
- node border was round and not square
- node shadow on hover was round and not square

First we modified curved relations to work as we wanted - follow node's square shape when dragged around the node. The code
modifications were done using GPT chat-bots in combination with a lot of trial and error.
After that, we modified straight relations to behave the same as curved relations. Initially, the plan was to combine "edge-clamped"
with "edge-arrow-head" programs using the "createEdgeCompoundProgram" factory, but the code seemed more complex than necessary,
especially since inside curved relation program we cover both relation line and head (arrow) with just one program.
After poking around and a lot of trial and error, the straight relation program was modified to fit our needs. This program was
modified without help of any GPT chat-bots (they just couldn't understand what the end goal was).

Please note, we don't have any WebGL developers inside our team. The code we modified was tested to match our needs and might
break at next Sigma.js update.
