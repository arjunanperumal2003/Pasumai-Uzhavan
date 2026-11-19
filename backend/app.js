
const allowedOrigins = [
  "https://pasumai-uzhavan-app-seven.vercel.app",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .flatMap((origin) => origin.split(","))
  .map((origin) => origin.trim().replace(/\/+$/, ""));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, "");

    // Allow configured domains and Vercel deployment domains
    const isAllowed =
      allowedOrigins.includes(normalizedOrigin) ||
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin);

    if (isAllowed) {
      return callback(null, true);
    }

    console.error("CORS BLOCKED ORIGIN:", origin);

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
  ],
};

app.use(cors(corsOptions));
