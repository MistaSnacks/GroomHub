window.CANVAS = {
  "title": "GroomLocal listing cleanup",
  "subtitle": "October 4, 2026 | Production verified",
  "verified": "Production deploy `dpl_GzjQBzzWVmchnWv2Ark7ZRcjG7hm` passed 43 live checks. The outreach evidence stops at 22:29 UTC on October 4.",
  "kinds": {
    "check": {
      "label": "Evidence and checks",
      "short": "Check",
      "fabric": "tan",
      "pill": "tan"
    },
    "data": {
      "label": "Database records",
      "short": "Data",
      "fabric": "olive",
      "pill": "olive"
    },
    "code": {
      "label": "Public site code",
      "short": "Code",
      "fabric": "denim",
      "pill": "denim"
    },
    "service": {
      "label": "Production deploy",
      "short": "Service",
      "fabric": "terracotta",
      "pill": "terracotta"
    }
  },
  "statuses": {
    "limited": {
      "label": "Cached evidence"
    }
  },
  "zones": [
    {
      "id": "data",
      "title": "Database cleanup",
      "eyebrow": "Evidence and writes",
      "cols": 2,
      "ground": "cream",
      "intro": "The cleanup protects owner control and keeps each public URL."
    },
    {
      "id": "site",
      "title": "Public site",
      "eyebrow": "Deploy and proof",
      "cols": 2,
      "ground": "board",
      "intro": "The site serves one profile per location and uses the canonical Seattle slug."
    }
  ],
  "rows": [
    [
      "data",
      "site"
    ]
  ],
  "steps": [
    {
      "id": "snapshot",
      "zone": "data",
      "kind": "check",
      "title": "Read outreach",
      "sub": "22:29 UTC snapshot",
      "status": "limited",
      "what": "The remote host did not respond. The audit used the saved October 4 outreach snapshot.",
      "fails": "Later sends and later bounces remain unchecked until the host responds.",
      "issues": [
        "The fresh outreach read failed."
      ],
      "next": "Use the saved evidence for this audit.",
      "files": [
        {
          "p": "src/lib/admin-console/outreach.ts",
          "l": "110",
          "n": "The reader falls back to the saved snapshot."
        }
      ],
      "refs": [
        "docs/data-fixes/2026-10-04-listing-cleanup-results.md#outreach-source-limit"
      ]
    },
    {
      "id": "backup",
      "zone": "data",
      "kind": "data",
      "title": "Save the backup",
      "sub": "245 full records",
      "what": "The backup table stores all 245 target records before this run changes any listing.",
      "rows": [
        [
          "Table",
          "`business_listings_cleanup_backup_20261004`"
        ],
        [
          "Access",
          "Public roles cannot read the backup."
        ],
        [
          "Timestamp",
          "The source has no `updated_at` field. The requested backup column is null."
        ]
      ],
      "fails": "A missing backup stops a write.",
      "files": [
        {
          "p": ".admin-cache/cleanup-20261004/backup.sql",
          "l": "1",
          "n": "The private SQL preserves complete source records."
        }
      ]
    },
    {
      "id": "names",
      "zone": "data",
      "kind": "data",
      "title": "Correct the names",
      "sub": "24 names and two ZIP codes",
      "reads": [
        "backup"
      ],
      "what": "The name plan contains 83 listings. Sixty names already matched. This run corrected 23 names and verified the apostrophe for Liz.",
      "rows": [
        [
          "ZIP codes",
          "Happy Paws Renton uses `98059`. Capitol Hill uses `98112`."
        ],
        [
          "Guard",
          "Each write requires no owner and the expected old value."
        ],
        [
          "URLs",
          "No listing slug changed."
        ]
      ],
      "fails": "A claimed listing or changed field stops the write.",
      "files": [
        {
          "p": "docs/data-fixes/2026-10-04-names.json",
          "l": "1"
        }
      ],
      "refs": [
        "docs/data-fixes/2026-10-04-listing-cleanup-results.md#name-status-for-every-planned-row"
      ]
    },
    {
      "id": "emails",
      "zone": "data",
      "kind": "check",
      "title": "Audit the emails",
      "sub": "158 verified; five cleared",
      "reads": [
        "snapshot",
        "backup"
      ],
      "what": "All 158 planned emails already matched the database. They passed the saved outreach checks. Five earlier emails failed the audit and were cleared.",
      "rows": [
        [
          "Evidence",
          "A match requires sent outreach without a recorded bounce, or the listing website domain for the earlier audit."
        ],
        [
          "Claims",
          "An exact listing email match can auto-approve a claim."
        ],
        [
          "Public data",
          "The listing email appears in JSON-LD."
        ],
        [
          "Quote requests",
          "Unclaimed listings reject quote requests before a lead insert or email send."
        ]
      ],
      "fails": "The cleanup skips owners, nonempty emails, bounces, duplicate addresses, and builder addresses.",
      "files": [
        {
          "p": "src/lib/claims.ts",
          "l": "135"
        },
        {
          "p": "src/lib/schema.ts",
          "l": "88"
        },
        {
          "p": "src/app/groomer/[slug]/actions.ts",
          "l": "106"
        }
      ]
    },
    {
      "id": "public",
      "zone": "site",
      "kind": "code",
      "title": "Use one profile",
      "sub": "Redirects and region labels",
      "what": "Duplicate FLOOF, Pawfect Wash, and Happy Paws URLs redirect to the kept profiles. The supply retailer leaves public groomer results.",
      "rows": [
        [
          "Distinct locations",
          "Happy Paws Seattle and the four Seattle Canine Club locations remain separate."
        ],
        [
          "Region",
          "Normandy Park, Duvall, and Black Diamond join Seattle Metro. Dog grooming city pages display the region."
        ]
      ],
      "files": [
        {
          "p": "src/lib/listing-review.ts",
          "l": "8"
        },
        {
          "p": "src/lib/metro-clusters.ts",
          "l": "40"
        },
        {
          "p": "src/app/dog-grooming/[state]/[city]/page.tsx",
          "l": "147"
        }
      ]
    },
    {
      "id": "deploy",
      "zone": "site",
      "kind": "service",
      "title": "Deploy production",
      "sub": "groomlocal.com",
      "reads": [
        "public"
      ],
      "what": "Vercel built the site and assigned the production domain. The private audit folder stayed outside the upload.",
      "rows": [
        [
          "Command",
          "`vercel --prod --archive=tgz --yes`"
        ],
        [
          "Deployment",
          "`dpl_GzjQBzzWVmchnWv2Ark7ZRcjG7hm`"
        ],
        [
          "Status",
          "Vercel reports `READY` and the production alias."
        ]
      ],
      "fails": "A build failure prevents a successful production deploy.",
      "files": [
        {
          "p": ".vercelignore",
          "l": "11"
        }
      ],
      "refs": [
        "https://groom-n43c5seqq-camrens-projects-24b42280.vercel.app"
      ]
    },
    {
      "id": "proof",
      "zone": "site",
      "kind": "check",
      "title": "Verify the live site",
      "sub": "81 tests; 43 live checks",
      "reads": [
        "deploy"
      ],
      "what": "All 81 tests and 43 live checks pass. TypeScript and lint checks pass. The browser shows each kept Seattle card once.",
      "rows": [
        [
          "Redirects",
          "The duplicate URLs return 308."
        ],
        [
          "Region",
          "Normandy Park displays Seattle Metro."
        ],
        [
          "Sitemap",
          "The listing and city sitemaps exclude duplicate URLs and `seattle-wa`."
        ],
        [
          "Health",
          "`/api/health` returns 200 and reports the database as `ok`."
        ]
      ],
      "files": [
        {
          "p": ".admin-cache/cleanup-20261004/public-proof.json",
          "l": "1"
        }
      ],
      "refs": [
        "docs/data-fixes/2026-10-04-listing-cleanup-results.md#verification"
      ]
    },
    {
      "id": "orphan",
      "zone": "site",
      "kind": "data",
      "title": "Delete the old city",
      "sub": "seattle-wa",
      "reads": [
        "proof"
      ],
      "what": "The cleanup saved the orphan city record, confirmed zero listing references, and deleted the old Seattle city row.",
      "rows": [
        [
          "Guard",
          "The delete requires zero listing references."
        ],
        [
          "Public route",
          "The old city URL still redirects to `seattle`."
        ],
        [
          "Scope",
          "Other small-town city rows remain for the work after October 8."
        ]
      ],
      "fails": "A listing reference stops the delete.",
      "files": [
        {
          "p": ".admin-cache/cleanup-20261004/orphan-city-delete.sql",
          "l": "1"
        }
      ]
    }
  ],
  "paths": [
    {
      "id": "cleanup",
      "title": "Follow the cleanup",
      "pill": "denim",
      "color": "#12958B",
      "question": "What happens when the cleanup changes a listing?",
      "steps": [
        "snapshot",
        "backup",
        "names",
        "emails",
        "public",
        "deploy",
        "proof",
        "orphan"
      ]
    },
    {
      "id": "email-audit",
      "title": "Check the emails",
      "pill": "olive",
      "color": "#C4452E",
      "question": "What happens when an email passes the audit?",
      "steps": [
        "snapshot",
        "backup",
        "emails",
        "proof"
      ]
    }
  ],
  "notes": [
    {
      "id": "mail-note",
      "zone": "data",
      "q": "Did this send email?",
      "a": "No. The cleanup sent no email. Unclaimed listings still reject quote requests.",
      "links": [
        "emails"
      ]
    },
    {
      "id": "live-note",
      "zone": "site",
      "q": "What remains unchecked?",
      "a": "The remote host did not respond. Later outreach sends and bounces remain unchecked.",
      "links": [
        "snapshot",
        "proof"
      ]
    }
  ]
};

function setCleanupRows() {
  window.CANVAS.rows = window.innerWidth < 760 ? [["data"], ["site"]] : [["data", "site"]];
}
setCleanupRows();
window.addEventListener("resize", setCleanupRows);
