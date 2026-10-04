// Seeds a demo user with tunnels for screenshots and prints a signed-in session
// cookie, so the dashboard can be captured without Google sign-in. CI only.
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"os"

	"github.com/google/uuid"
	"github.com/moroz/pindakaas/config"
	"github.com/moroz/pindakaas/db/queries"
	"github.com/moroz/pindakaas/registry"
	"github.com/moroz/pindakaas/services"
	"github.com/moroz/pindakaas/web/sessions"

	_ "modernc.org/sqlite"
)

type tunnel struct {
	Subdomain string `json:"subdomain"`
	Username  string `json:"username"`
	Password  string `json:"password"`
}

func main() {
	ctx := context.Background()
	db, err := sql.Open("sqlite", config.DatabaseUrl)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	given, family := "Demo", "User"
	user, err := queries.New(db).InsertUser(ctx, &queries.InsertUserParams{
		ID:         uuid.Must(uuid.NewV7()),
		Email:      "demo@example.com",
		GivenName:  &given,
		FamilyName: &family,
	})
	if err != nil {
		log.Fatal("insert user: ", err)
	}

	token, err := services.NewUserTokenService(db).IssueAccessTokenForUser(ctx, user)
	if err != nil {
		log.Fatal("issue token: ", err)
	}

	store, err := sessions.NewStore(config.SessionKey)
	if err != nil {
		log.Fatal(err)
	}
	cookie, err := store.EncodeSession(sessions.Payload{config.AccessTokenSessionKey: token.Token})
	if err != nil {
		log.Fatal("encode session: ", err)
	}

	tunnelService := services.NewTunnelService(db, registry.New())
	var tunnels []tunnel
	for range 4 {
		t, err := tunnelService.CreateTunnelForUser(ctx, user)
		if err != nil {
			log.Fatal("create tunnel: ", err)
		}
		tunnels = append(tunnels, tunnel{t.Subdomain, t.Username, string(t.PasswordEncrypted.Bytes())})
	}

	json.NewEncoder(os.Stdout).Encode(map[string]any{
		"cookie_name": config.SessionCookieName,
		"cookie":      cookie,
		"tunnels":     tunnels,
	})
}
