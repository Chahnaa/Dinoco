-- Add diverse movies covering all moods and genres
USE movie_review_db;

-- HAPPY MOOD (Comedy, Animation, Family, Musical)
INSERT INTO movies (title, genre, language, release_year, duration_minutes, poster_url, description) VALUES
('The Grand Budapest Hotel', 'Comedy', 'English', 2014, 100, 'https://image.tmdb.org/t/p/w500/nX5XotM9yprCKarRH4fzOq1VM1J.jpg', 'A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy in the hotel''s glorious years under an exceptional concierge.'),
('Paddington 2', 'Family', 'English', 2017, 104, 'https://image.tmdb.org/t/p/w500/gF4rXXS9gRt0oNmYDPRu37gL0gW.jpg', 'Paddington, now happily settled with the Brown family, picks up a series of odd jobs to buy the perfect present for his Aunt Lucy.'),
('Toy Story 4', 'Animation', 'English', 2019, 100, 'https://image.tmdb.org/t/p/w500/w9kR8qbmQ01HwnvK4alvnQ2ca0L.jpg', 'Woody has always been confident about his place in the world until Bonnie adds a toy named Forky to her room.'),
('La La Land', 'Musical', 'English', 2016, 128, 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.'),
('Spider-Man: Into the Spider-Verse', 'Animation', 'English', 2018, 117, 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', 'Teen Miles Morales becomes the Spider-Man of his universe and must join forces with five spider-powered individuals from other dimensions.'),
('School of Rock', 'Comedy', 'English', 2003, 109, 'https://image.tmdb.org/t/p/w500/kD0b8d44a4vXzNCtslY5fL8w74e.jpg', 'After being kicked out of his rock band, Dewey Finn becomes a substitute teacher and turns his class into a rock band.'),
('Coco', 'Animation', 'English', 2017, 105, 'https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg', 'Aspiring musician Miguel teams up with charming trickster Hector on an extraordinary journey through the Land of the Dead.'),
('The Princess Bride', 'Family', 'English', 1987, 98, 'https://image.tmdb.org/t/p/w500/dvjqlp2sAL98Qn8m4dWKv5bpqQC.jpg', 'A classic fairy tale with swordplay, giants, an evil prince, a beautiful princess, and yes, some kissing.');

-- DARK MOOD (Horror, Thriller, Mystery, Crime)
INSERT INTO movies (title, genre, language, release_year, duration_minutes, poster_url, description) VALUES
('Se7en', 'Crime', 'English', 1995, 127, 'https://image.tmdb.org/t/p/w500/6yoghtyTpznpBik8EngEmJskVUO.jpg', 'Two detectives hunt a serial killer who uses the seven deadly sins as his motives.'),
('The Silence of the Lambs', 'Thriller', 'English', 1991, 118, 'https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg', 'A young FBI cadet must receive the help of an incarcerated cannibal killer to catch another serial killer.'),
('Zodiac', 'Mystery', 'English', 2007, 157, 'https://image.tmdb.org/t/p/w500/6YmeO4pB7XTh8P8F0RJIPEvUCRd.jpg', 'A San Francisco cartoonist becomes an amateur detective obsessed with tracking down the Zodiac Killer.'),
('Gone Girl', 'Mystery', 'English', 2014, 149, 'https://image.tmdb.org/t/p/w500/lv5xShBIDPe7m4ufdlV0IAc7Avk.jpg', 'With his wife''s disappearance having become the focus of an intense media circus, a man sees the spotlight turned on him.'),
('Prisoners', 'Crime', 'English', 2013, 153, 'https://image.tmdb.org/t/p/w500/uhviyknTT5cEQXbn6vWIqfM4vGm.jpg', 'When his daughter and her friend go missing, a desperate father takes matters into his own hands.'),
('Shutter Island', 'Thriller', 'English', 2010, 138, 'https://image.tmdb.org/t/p/w500/4GDy0PHYX3VRXUtwK5ysFbg3kEx.jpg', 'In 1954, a U.S. Marshal investigates the disappearance of a patient from a hospital for the criminally insane.'),
('The Conjuring', 'Horror', 'English', 2013, 112, 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg', 'Paranormal investigators Ed and Lorraine Warren work to help a family terrorized by a dark presence in their farmhouse.'),
('A Quiet Place', 'Horror', 'English', 2018, 90, 'https://image.tmdb.org/t/p/w500/nAU74GmpUk7t5iklEp3bufwDq4n.jpg', 'In a post-apocalyptic world, a family is forced to live in silence while hiding from creatures that hunt by sound.');

-- MOTIVATIONAL MOOD (Biography, Drama, Sport, Documentary)
INSERT INTO movies (title, genre, language, release_year, duration_minutes, poster_url, description) VALUES
('The Pursuit of Happyness', 'Biography', 'English', 2006, 117, 'https://image.tmdb.org/t/p/w500/kwg4ReL1SdhBPi5OvnvM37odQPF.jpg', 'A struggling salesman takes custody of his son as he''s poised to begin a life-changing professional career.'),
('Rocky', 'Sport', 'English', 1976, 120, 'https://image.tmdb.org/t/p/w500/i5xiwMRKzlc1JN8R0Qvj7vHXnWL.jpg', 'A small-time boxer gets a supremely rare chance to fight the heavy-weight champion in a bout.'),
('The Blind Side', 'Biography', 'English', 2009, 129, 'https://image.tmdb.org/t/p/w500/bMV2G1yiR2TpNLkjxrWyW3fkCdF.jpg', 'The story of Michael Oher, a homeless teen who becomes an All-American football player with help from a caring woman.'),
('Whiplash', 'Drama', 'English', 2014, 106, 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg', 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by a ruthless teacher.'),
('Hidden Figures', 'Biography', 'English', 2016, 127, 'https://image.tmdb.org/t/p/w500/9lfz2W2uGjyow3am00rsPJ8iOyq.jpg', 'The story of three African-American women who served as the brains behind NASA''s launch of astronaut John Glenn into orbit.'),
('Remember the Titans', 'Sport', 'English', 2000, 113, 'https://image.tmdb.org/t/p/w500/pEq5vp95YmJZJxihjCHlhlVuvFX.jpg', 'The true story of a newly appointed African-American coach and his high school team in their first season as a racially integrated unit.'),
('The Social Network', 'Biography', 'English', 2010, 120, 'https://image.tmdb.org/t/p/w500/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg', 'The story of the founding of Facebook and the lawsuits that followed.'),
('Moneyball', 'Sport', 'English', 2011, 133, 'https://image.tmdb.org/t/p/w500/yKJwJQNfwkXqQH4u1hJkbW4ccxw.jpg', 'Oakland A''s general manager Billy Beane''s successful attempt to assemble a baseball team on a lean budget.');

-- THRILLER MOOD (Thriller, Action, Crime, Mystery)
INSERT INTO movies (title, genre, language, release_year, duration_minutes, poster_url, description) VALUES
('The Dark Knight', 'Action', 'English', 2008, 152, 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest tests to fight injustice.'),
('Inception', 'Thriller', 'English', 2010, 148, 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.'),
('The Departed', 'Crime', 'English', 2006, 151, 'https://image.tmdb.org/t/p/w500/nT97ifVT2J1yMQmeq20Qblg61T.jpg', 'An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in Boston.'),
('No Country for Old Men', 'Thriller', 'English', 2007, 122, 'https://image.tmdb.org/t/p/w500/bj1v6YKF8yHqA489VFfnQvOJpnc.jpg', 'A hunter stumbles upon drug dealers in the Texas desert and gets caught in a violent cat-and-mouse game.'),
('Mad Max: Fury Road', 'Action', 'English', 2015, 120, 'https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg', 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland.'),
('The Bourne Identity', 'Action', 'English', 2002, 119, 'https://image.tmdb.org/t/p/w500/bXQIL36VQdzJ69lcjQR1WQzJqQR.jpg', 'A man is picked up by a fishing boat with no memory of who he is and must evade assassins while trying to discover his identity.'),
('John Wick', 'Action', 'English', 2014, 101, 'https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg', 'An ex-hitman comes out of retirement to track down the gangsters that killed his dog and took everything from him.'),
('Knives Out', 'Mystery', 'English', 2019, 130, 'https://image.tmdb.org/t/p/w500/pThyQovXQrw2m0s9x82twj48Jq4.jpg', 'A detective investigates the death of a patriarch of an eccentric, combative family.');

-- EMOTIONAL MOOD (Drama, Romance, Family)
INSERT INTO movies (title, genre, language, release_year, duration_minutes, poster_url, description) VALUES
('The Shawshank Redemption', 'Drama', 'English', 1994, 142, 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', 'Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.'),
('Forrest Gump', 'Drama', 'English', 1994, 142, 'https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg', 'The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man with an IQ of 75.'),
('A Beautiful Mind', 'Drama', 'English', 2001, 135, 'https://image.tmdb.org/t/p/w500/zwzWCmH72OSC9NA0ipoqw5Zjya8.jpg', 'After John Nash, a brilliant but asocial mathematician, accepts secret work in cryptography, his life takes a turn to the nightmarish.'),
('Life is Beautiful', 'Drama', 'Italian', 1997, 116, 'https://image.tmdb.org/t/p/w500/74hLDKjD5aGYOotO6esUVaeISa2.jpg', 'A Jewish-Italian man uses his imagination to shield his son from the horrors of a Nazi concentration camp.'),
('The Green Mile', 'Drama', 'English', 1999, 189, 'https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmIo52R.jpg', 'The lives of guards on Death Row are affected by one of their charges who possesses mysterious healing powers.'),
('Philadelphia', 'Drama', 'English', 1993, 125, 'https://image.tmdb.org/t/p/w500/8LAVoOMMTlQPaGYuB0pCiWd4mTW.jpg', 'A man with HIV is fired by his law firm and hires a homophobic lawyer to help sue the company.'),
('Up', 'Animation', 'English', 2009, 96, 'https://image.tmdb.org/t/p/w500/mFvoEwSfLqbcWwFsDjQebn9bzFe.jpg', 'An elderly widower and a wilderness explorer fly to South America in a house lifted by balloons.'),
('Wonder', 'Family', 'English', 2017, 113, 'https://image.tmdb.org/t/p/w500/ouYgALz7CRLa5gX3RNuPyzoRIbO.jpg', 'A boy with facial differences attends fifth grade and overcomes challenges to be accepted.');

-- ADVENTUROUS MOOD (Adventure, Action, Fantasy, Sci-Fi)
INSERT INTO movies (title, genre, language, release_year, duration_minutes, poster_url, description) VALUES
('The Lord of the Rings: The Fellowship of the Ring', 'Adventure', 'English', 2001, 178, 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', 'A meek Hobbit sets out on a journey to destroy a powerful ring and save Middle-earth from the Dark Lord Sauron.'),
('Avatar', 'Sci-Fi', 'English', 2009, 162, 'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg', 'A paraplegic Marine is sent to Pandora on a mission, but becomes torn between following his orders and protecting the world.'),
('Interstellar', 'Sci-Fi', 'English', 2014, 169, 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.'),
('Pirates of the Caribbean: The Curse of the Black Pearl', 'Adventure', 'English', 2003, 143, 'https://image.tmdb.org/t/p/w500/z8onk7LV9Mmw6zBz4hT0rf4lL8J.jpg', 'A blacksmith teams up with an eccentric pirate to save the governor''s daughter and reclaim the pirate''s ship.'),
('Jurassic Park', 'Adventure', 'English', 1993, 127, 'https://image.tmdb.org/t/p/w500/b1xCNnyrPebIc7EWNZIa6jhb1Ww.jpg', 'A theme park suffers a major power breakdown that allows its cloned dinosaur exhibits to run amok.'),
('The Matrix', 'Sci-Fi', 'English', 1999, 136, 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', 'A computer hacker learns about the true nature of reality and his role in the war against its controllers.'),
('Indiana Jones and the Raiders of the Lost Ark', 'Adventure', 'English', 1981, 115, 'https://image.tmdb.org/t/p/w500/ceG9VzoRAVGwivFU403Wc3AHRys.jpg', 'Archaeologist Indiana Jones races against the Nazis to find the Ark of the Covenant.'),
('Guardians of the Galaxy', 'Sci-Fi', 'English', 2014, 121, 'https://image.tmdb.org/t/p/w500/r7vmZjiyZw9rpJMQJdXpjgiCOk9.jpg', 'A group of intergalactic criminals must pull together to stop a fanatical warrior from taking control of the universe.');

-- ROMANTIC MOOD (Romance, Drama, Comedy)
INSERT INTO movies (title, genre, language, release_year, duration_minutes, poster_url, description) VALUES
('The Notebook', 'Romance', 'English', 2004, 123, 'https://image.tmdb.org/t/p/w500/qom1SZSENdmHFNZBXbtJAU0WTlC.jpg', 'A poor yet passionate young man falls in love with a rich young woman, giving her a sense of freedom.'),
('Titanic', 'Romance', 'English', 1997, 194, 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', 'A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.'),
('Pride and Prejudice', 'Romance', 'English', 2005, 129, 'https://image.tmdb.org/t/p/w500/sGjIvtVvTlWnia2zfJfHz81pZ9Q.jpg', 'Sparks fly when spirited Elizabeth Bennet meets single, rich, and proud Mr. Darcy in 19th-century England.'),
('500 Days of Summer', 'Romance', 'English', 2009, 95, 'https://image.tmdb.org/t/p/w500/f9mbM0YMLpYemcWx6o2WeiYQLDP.jpg', 'An offbeat romantic comedy about a woman who doesn''t believe true love exists, and the young man who falls for her.'),
('Before Sunrise', 'Romance', 'English', 1995, 101, 'https://image.tmdb.org/t/p/w500/cUwXd4kEzMUaoMoc3XW6ggF5AnJ.jpg', 'A young man and woman meet on a train and spend a night walking and talking in Vienna.'),
('Crazy, Stupid, Love', 'Romance', 'English', 2011, 118, 'https://image.tmdb.org/t/p/w500/p4RafgAPk558muOjnBMHhMArjS2.jpg', 'A middle-aged husband''s life changes dramatically when his wife asks him for a divorce.'),
('The Fault in Our Stars', 'Romance', 'English', 2014, 126, 'https://image.tmdb.org/t/p/w500/ep7dF4QR4Mm39LI958V0XbwE0hK.jpg', 'Two teens who meet in a cancer support group fall in love and travel to Amsterdam to meet a reclusive author.'),
('Eternal Sunshine of the Spotless Mind', 'Romance', 'English', 2004, 108, 'https://image.tmdb.org/t/p/w500/5MwkWH9tYHv3mV9OdYTMR5qreIz.jpg', 'When their relationship turns sour, a couple undergoes a medical procedure to have each other erased from their memories.');
