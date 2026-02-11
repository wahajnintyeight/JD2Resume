import { type ATSScanResult } from '@/lib/api/resume';
import { API_BASE } from '@/lib/api/client';

async function fetchATSScanData(id: string): Promise<ATSScanResult | null> {
  try {
    // Use 127.0.0.1 instead of localhost to avoid IPv6 issues on Windows
    const apiBase = API_BASE.replace('localhost', '127.0.0.1');

    // Try to get cached scan results first
    const response = await fetch(`${apiBase}/ats/scan/${id}/cached`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Cached ATS scan fetch failed:', response.status, await response.text());
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching cached ATS scan data:', error);
    return null;
  }
}

export default async function ATSScanPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const results = await fetchATSScanData(resolvedParams.id);
  
  // Generate date once on server to avoid hydration mismatch
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Handle case where no cached results exist
  if (!results) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-2xl font-bold uppercase mb-4">No Scan Results Found</h1>
          <p className="font-mono text-sm text-gray-600">
            Please run an ATS scan first before generating a PDF report.
          </p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="ats-report-print bg-white p-8 max-w-5xl mx-auto">
        <div className="border-b-4 border-red-600 pb-4 mb-6">
          <h1 className="font-serif text-4xl font-bold uppercase text-red-600">Error</h1>
        </div>
        <p className="font-mono text-lg">
          Failed to load ATS scan data. Please ensure:
        </p>
        <ul className="font-mono text-sm mt-4 list-disc pl-6 space-y-2">
          <li>The backend server is running</li>
          <li>The resume ID is valid</li>
          <li>The resume has an associated job description</li>
        </ul>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-700';
    if (score >= 75) return 'text-blue-700';
    if (score >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-700';
    if (score >= 75) return 'bg-blue-50 border-blue-700';
    if (score >= 60) return 'bg-yellow-50 border-yellow-700';
    return 'bg-red-50 border-red-700';
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `
      }} />
      <div className="ats-report-print bg-white p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="border-b-4 border-black pb-4 mb-6">
        <h1 className="font-serif text-4xl font-bold uppercase">ATS Compatibility Report</h1>
        <p className="font-mono text-sm text-gray-600 mt-2">
          Automated Tracking System Analysis • Generated {generatedDate}
        </p>
      </div>

      {/* Overall Score */}
      <div className={`border-2 p-6 mb-6 ${getScoreBgColor(results.overall_score)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold uppercase mb-2">Overall Score</h2>
            <p className="font-mono text-sm">
              Pass Probability:{' '}
              <span className="font-bold uppercase">{results.pass_probability}</span>
            </p>
          </div>
          <div className={`text-6xl font-bold ${getScoreColor(results.overall_score)}`}>
            {results.overall_score}
          </div>
        </div>
      </div>

      {/* Title Analysis */}
      {(results as any).title_analysis && (
        <div className="mb-6 border-2 border-black p-4">
          <h3 className="font-serif text-xl font-bold uppercase mb-3">Job Title Match</h3>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-600">Job Description:</span>{' '}
              <span className="font-bold">{(results as any).title_analysis.jd_title}</span>
            </div>
            <div>
              <span className="text-gray-600">Your Resume:</span>{' '}
              <span className="font-bold">{(results as any).title_analysis.resume_title}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>{' '}
              <span className="font-bold">{(results as any).title_analysis.match_status}</span>
            </div>
            {(results as any).title_analysis.recommendation && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-600">
                {(results as any).title_analysis.recommendation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hard Skills Analysis */}
      {(results as any).hard_skills_analysis && (
        <div className="mb-6 border-2 border-black p-4">
          <h3 className="font-serif text-xl font-bold uppercase mb-3">Hard Skills Match</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="border border-black p-2 text-center">
              <div className="text-2xl font-bold">
                {(results as any).hard_skills_analysis.total_keywords_searched}
              </div>
              <div className="font-mono text-xs">Keywords Searched</div>
            </div>
            <div className="border border-black p-2 text-center">
              <div className="text-2xl font-bold">
                {(results as any).hard_skills_analysis.exact_matches_found}
              </div>
              <div className="font-mono text-xs">Exact Matches</div>
            </div>
            <div className="border border-black p-2 text-center">
              <div className="text-2xl font-bold">
                {(results as any).hard_skills_analysis.match_rate}
              </div>
              <div className="font-mono text-xs">Match Rate</div>
            </div>
          </div>

          {(results as any).hard_skills_analysis.synonym_traps?.length > 0 && (
            <div className="border border-orange-600 bg-orange-50 p-3">
              <h4 className="font-mono text-xs font-bold uppercase mb-2">Synonym Traps</h4>
              {(results as any).hard_skills_analysis.synonym_traps.map((trap: any, i: number) => (
                <div key={i} className="font-mono text-xs mb-1">
                  <span className="line-through">{trap.resume_term}</span> → <span className="font-bold">{trap.jd_term}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Scores */}
      <div className="mb-6">
        <h3 className="font-serif text-xl font-bold uppercase mb-3">Category Breakdown</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(results.category_scores).map(([key, category]) => (
            <div key={key} className="border-2 border-black p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold uppercase">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className={`text-xl font-bold ${getScoreColor(category.score)}`}>
                  {category.score}
                </span>
              </div>
              <div className="h-2 bg-gray-200 border border-black mb-1">
                <div
                  className={`h-full ${category.score >= 75 ? 'bg-green-700' : category.score >= 50 ? 'bg-yellow-700' : 'bg-red-700'}`}
                  style={{ width: `${category.score}%` }}
                />
              </div>
              <p className="font-mono text-xs text-gray-600">{category.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Knockout Risks */}
      {results.knockout_risks && results.knockout_risks.length > 0 && (
        <div className="mb-6 border-2 border-red-600 bg-red-50 p-4">
          <h3 className="font-serif text-xl font-bold uppercase mb-2">Knockout Risks</h3>
          <ul className="space-y-1">
            {results.knockout_risks.map((risk, i) => (
              <li key={i} className="font-mono text-sm">
                • {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths */}
      {results.strengths && results.strengths.length > 0 && (
        <div className="mb-6 border-2 border-green-700 bg-green-50 p-4">
          <h3 className="font-serif text-xl font-bold uppercase mb-2">Strengths</h3>
          <ul className="space-y-1">
            {results.strengths.map((strength, i) => (
              <li key={i} className="font-mono text-sm">
                • {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {results.weaknesses && results.weaknesses.length > 0 && (
        <div className="mb-6 border-2 border-yellow-700 bg-yellow-50 p-4">
          <h3 className="font-serif text-xl font-bold uppercase mb-2">Weaknesses</h3>
          <ul className="space-y-1">
            {results.weaknesses.map((weakness, i) => (
              <li key={i} className="font-mono text-sm">
                • {weakness}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Keywords */}
      {results.missing_keywords && results.missing_keywords.length > 0 && (
        <div className="mb-6 border-2 border-red-600 bg-red-50 p-4">
          <h3 className="font-serif text-xl font-bold uppercase mb-2">Missing Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {results.missing_keywords.map((keyword, i) => (
              <span
                key={i}
                className="inline-block border border-black bg-white px-2 py-1 font-mono text-xs"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {results.recommendations && results.recommendations.length > 0 && (
        <div className="mb-6 border-2 border-blue-700 bg-blue-50 p-4">
          <h3 className="font-serif text-xl font-bold uppercase mb-2">Action Plan</h3>
          <ol className="space-y-2">
            {results.recommendations.map((rec, i) => (
              <li key={i} className="font-mono text-sm">
                {i + 1}. {rec}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-black pt-4 mt-8">
        <p className="font-mono text-xs text-gray-600 text-center">
          This report analyzes how your resume performs in Applicant Tracking Systems (ATS).
          <br />
          Focus on exact keyword matches and hard skills for maximum visibility.
        </p>
      </div>
    </div>
    </>
  );
}
