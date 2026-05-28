import type { Track } from '../lib/types'
import { Callout, Figure, H2, Lead, LI, Mono, P, UL } from '../components/ui/primitives'
import { CodeBlock } from '../components/ui/CodeBlock'
import { ConfusionMatrix } from '../components/widgets/ConfusionMatrix'

export const track6: Track = {
  id: 'multiclass',
  index: 6,
  title: 'Multi-class extension',
  subtitle: 'From binary to N-way classification',
  accent: 'data',
  glyph: '06',
  outcome: 'A 4-class classifier with a confusion matrix matching paper Fig. 8 in shape.',
  lessons: [
    {
      id: 'binary-to-nway',
      title: 'From binary to N-way',
      kicker: 'sklearn already handles this',
      minutes: 4,
      body: (
        <div className="lesson">
          <Lead>
            You don't need to change the reservoir to handle multiple classes. The reservoir
            doesn't know what the classes are — it just projects inputs into a feature space.
            Only the readout changes.
          </Lead>

          <H2>What changes</H2>
          <UL>
            <LI>
              <Mono>LogisticRegression(multi_class='multinomial')</Mono> in sklearn fits a softmax
              classifier without any other changes. It will pick the multi-class strategy
              automatically in recent versions.
            </LI>
            <LI>
              Your label vector goes from 2 unique values to N. Make sure your collection script
              produces balanced classes (or close enough).
            </LI>
            <LI>
              Cross-validation needs a stratified splitter (<Mono>StratifiedKFold</Mono>) to keep
              each fold class-balanced.
            </LI>
          </UL>

          <H2>What doesn't change</H2>
          <P>
            The reservoir hyperparameters (G_i, G_f, N) you picked in Module 5 carry over. The
            paper retunes them across datasets, but on the same hardware and a similar
            distribution, the operating point shouldn't move much.
          </P>

          <Callout tone="note" title="If accuracy drops a lot">
            Going from 2 to 4 classes, expect <em>some</em> accuracy drop — random guessing goes
            from 50% to 25%, so the model has more room to be wrong. A 5-10% drop is normal. A
            30% drop means something is off: bad class balance, near-identical classes, or a
            featurizer that throws away class-discriminative information.
          </Callout>
        </div>
      ),
    },
    {
      id: 'confusion-matrix',
      title: 'Reading a confusion matrix',
      kicker: 'Where is the classifier failing?',
      minutes: 6,
      body: (
        <div className="lesson">
          <Lead>
            A single accuracy number is a summary. A confusion matrix tells you{' '}
            <em>which</em> classes are getting confused with <em>which</em>. That's where the
            actionable insight lives.
          </Lead>

          <Figure title="confusion matrix — interactive" caption="Try the presets. Notice how high accuracy can hide a class imbalance.">
            <ConfusionMatrix />
          </Figure>

          <H2>What the diagonal tells you</H2>
          <P>
            A strong diagonal means the model usually gets it right. Off-diagonal mass tells you
            which pairs are confusable. If <Mono>cache_thrash</Mono> often gets predicted as{' '}
            <Mono>row_hammer</Mono>, that's interesting — both are memory-bus-stressing workloads,
            and your featurizer may not be distinguishing them well.
          </P>

          <H2>Computing it</H2>
          <CodeBlock
            lang="python"
            caption="scripts/evaluate.py"
            code={`from sklearn.metrics import confusion_matrix, classification_report
from sklearn.model_selection import StratifiedKFold, cross_val_predict
import numpy as np

def evaluate(traces, labels, classifier_factory, reservoir, class_names):
    from rc.train import featurize
    X, y = featurize(traces, labels, reservoir)

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)
    y_pred = cross_val_predict(classifier_factory(), X, y, cv=skf)

    cm = confusion_matrix(y, y_pred)
    print("Confusion matrix (rows = true, cols = pred):")
    print(cm)
    print()
    print(classification_report(y, y_pred, target_names=class_names))
    return cm`}
          />
        </div>
      ),
    },
    {
      id: 'metrics',
      title: 'Metrics that matter',
      kicker: 'Accuracy is not enough for class imbalance',
      minutes: 5,
      body: (
        <div className="lesson">
          <Lead>
            If 90% of your traces are benign, a model that always predicts "benign" gets 90%
            accuracy and detects no attacks. Beyond accuracy, track precision and recall per class.
          </Lead>

          <H2>Definitions, applied here</H2>
          <UL>
            <LI><strong>Precision (for attack class)</strong> — of the traces I flagged as attack, what fraction actually were? High precision = few false alarms.</LI>
            <LI><strong>Recall (for attack class)</strong> — of the traces that were attacks, what fraction did I catch? High recall = few missed attacks.</LI>
            <LI><strong>F1</strong> — harmonic mean. Useful when you want a single number that won't be gamed by predicting all-one-class.</LI>
          </UL>

          <H2>What the paper reports</H2>
          <P>
            The paper reports per-class accuracy plus precision and recall (see Fig. 10 and Table I
            for the comparisons). Mirror this format in your write-up. It tells the reader that you
            understand which numbers matter.
          </P>

          <Callout tone="insight" title="The class imbalance trap">
            If your benign class is much larger than the attack classes — easy to happen when you
            collect benign aggressively because it's "safe" — a high-accuracy model may be
            essentially ignoring attacks. Always look at per-class recall.
          </Callout>
        </div>
      ),
      implementation: {
        intro: <>Add the third workload class, extend the readout to multi-class, produce a confusion matrix.</>,
        estimatedHours: '3-4 hours',
        tasks: [
          {
            title: 'Make all 4 classes',
            description: <>Generate enough traces of benign, cache_thrash, branch_abuse, and row_hammer for at least 40 per class.</>,
            files: ['hpc-classifier/data/raw/'],
            successCheck: 'collect_all.py reports 40+ traces per class. ls data/raw/ shows 4 subdirs.',
          },
          {
            title: 'Update build_classifier for multi-class',
            description: <>Confirm LogisticRegression handles multi-class by default; if not, set <Mono>multi_class='multinomial'</Mono>.</>,
            files: ['hpc-classifier/rc/train.py'],
            successCheck: 'Training on 4 classes produces a 4-row classification_report.',
          },
          {
            title: 'Plot the confusion matrix',
            description: <>Pretty plot with class labels on axes. Save to results/.</>,
            files: ['hpc-classifier/scripts/evaluate.py', 'hpc-classifier/results/confusion.png'],
            successCheck: 'You can identify the most-confused class pair from the plot in 5 seconds.',
          },
        ],
      },
    },
  ],
}
