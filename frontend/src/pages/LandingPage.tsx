import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

const freeFeatures = ['Grant Estimator', 'Basic Timeline Simulator', 'General project info'];

const premiumFeatures = [
    'Access to the Ballot Probability Engine',
    'Hyper-detailed unit-level analysis: sun direction, lift lobby distance, rubbish chute distance, and block-specific trade-offs',
    'Amenity Proximity Scoring',
    'Personalised strategic alerts',
];

export default function LandingPage() {
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (!showToast) {
            return;
        }

        const timeoutId = window.setTimeout(() => setShowToast(false), 3200);

        return () => window.clearTimeout(timeoutId);
    }, [showToast]);

    const showComingSoonToast = () => {
        setShowToast(false);
        window.setTimeout(() => setShowToast(true), 20);
    };

    return (
        <div className="landing">
            <section className="landing__shell" aria-labelledby="landing-heading">
                <div className="landing__header">
                    <div>
                        <p className="landing__eyebrow">Two tiers</p>
                        <h1 id="landing-heading">Choose your BTO planning tier.</h1>
                        <p>
                            Start free for baseline planning, or unlock premium analysis for sharper
                            project, block, and unit decisions.
                        </p>
                    </div>
                </div>

                <div className="landing__body">
                    <article className="landing__tier">
                        <div className="landing__tier-topline">
                            <h2>Free</h2>
                            <span>Essentials</span>
                        </div>
                        <p className="landing__tier-copy">
                            Keep the first pass simple with quick planning tools and the project
                            facts you need before building a shortlist.
                        </p>
                        <ul className="landing__feature-list">
                            {freeFeatures.map((feature) => (
                                <li key={feature}>{feature}</li>
                            ))}
                        </ul>
                        <Link to="/onboarding" className="btn btn--secondary landing__tier-button">
                            Use Free
                        </Link>
                    </article>

                    <article className="landing__tier landing__tier--premium">
                        <div className="landing__tier-topline">
                            <h2>Premium</h2>
                            <span>Strategy</span>
                        </div>
                        <p className="landing__tier-copy">
                            Add probability, proximity, block-level, and unit-level signals when you
                            want a sharper read before committing to your application strategy.
                        </p>
                        <ul className="landing__feature-list">
                            {premiumFeatures.map((feature) => (
                                <li key={feature}>{feature}</li>
                            ))}
                        </ul>
                        <button
                            type="button"
                            className="btn landing__tier-button landing__premium-action"
                            onClick={showComingSoonToast}
                        >
                            Purchase Premium
                        </button>
                    </article>
                </div>
            </section>

            {showToast && (
                <div className="landing__toast" role="status" aria-live="polite">
                    Feature is coming soon, stay tuned!
                </div>
            )}
        </div>
    );
}
