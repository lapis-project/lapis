<script lang="ts" setup>
import type { AccordionItem } from "@nuxt/ui";

const devs = ref([
	{
		name: "Kilian Kukelka",
		description: "kkukelka",
		to: "https://github.com/kkukelka",
		target: "_blank",
		avatar: {
			src: "https://avatars.githubusercontent.com/u/17953978?v=4",
			alt: "kkukelka",
		},
	},
	{
		name: "Jakob Bal",
		description: "jaketpr-b",
		to: "https://github.com/jaketpr-b",
		target: "_blank",
		avatar: {
			src: "https://avatars.githubusercontent.com/u/5092574?v=4",
			alt: "jaketpr-b",
		},
	},
	{
		name: "Marie Rohler",
		description: "meeriemarie",
		to: "https://github.com/meeriemarie",
		target: "_blank",
		avatar: {
			src: "https://avatars.githubusercontent.com/u/146174200?v=4",
			alt: "meeriemarie",
		},
	},
	{
		name: "Olivia Reichl",
		description: "oliviareichl",
		to: "https://github.com/oliviareichl",
		target: "_blank",
		avatar: {
			src: "https://avatars.githubusercontent.com/u/122532494?v=4",
			alt: "oliviareichl",
		},
	},
]);

const items = [
	"https://picsum.photos/640/640?grayscale&random=1",
	"https://picsum.photos/640/640?grayscale&random=2",
	"https://picsum.photos/640/640?grayscale&random=3",
	"https://picsum.photos/640/640?grayscale&random=4",
	"https://picsum.photos/640/640?grayscale&random=5",
	"https://picsum.photos/640/640?grayscale&random=6",
	"https://picsum.photos/640/640?grayscale&random=7",
	"https://picsum.photos/640/640?grayscale&random=8",
];

const accordionItems = ref<Array<AccordionItem>>([
	{
		label: "What was Barry's best bee friend's name?",
		content:
			"Adam was his good friend, who was very happy with carrying out a normal bee role in life.",
	},
	{
		label: "Where did Vanessa and Barry have to go to save the planet?",
		content: " The Parade of Roses in Pasadena",
	},
	{
		label: "Which of these did Ken NOT use to try to assassinate Barry?",
		content: "Spray him with bug spray",
	},
	{
		label: "What Disney character was cruelly tranquilized for illegally using honey?",
		content:
			"Winnie the Pooh, in his Playhouse Disney form, was sitting by Piglet and doing his favorite thing, eating honey. Then, law enforcers came and tranquilized him and took his honey away because eating honey was not allowed any more.",
	},
]);
</script>

<template>
	<MainContent class="container">
		<UPage>
			<UPageHeader
				description="Please take a look around and be(e) fascinated by the beauty of NuxtUI."
				headline="Made with NuxtUI"
				title="Welcome to LIÖ"
			>
			</UPageHeader>

			<template #left>
				<UPageAside>
					<h3 class="font-semibold pt-4 pb-16">Want to see some random images?</h3>
					<UCarousel
						v-slot="{ item }"
						arrows
						:autoplay="{ delay: 3000 }"
						:items="items"
						loop
						orientation="vertical"
						:ui="{ container: 'h-[480px]', item: 'basis-1/3' }"
					>
						<img alt="random image" class="rounded-lg" height="320" :src="item" width="320" />
					</UCarousel>
				</UPageAside>
			</template>

			<UPageBody>
				<!-- <UContentSearchButton :collapsed="false" :kbds="['alt', 'O']" /> -->
				<h2 class="font-semibold text-xl text-highlighted">1. Very Important Information</h2>
				<p class="p-6 text-pretty">
					According to all known laws of aviation, there is no way a bee should be able to fly. Its
					wings are too small to get its fat little body off the ground. The bee, of course, flies
					anyway because bees don't care what humans think is impossible. Yellow, black. Yellow,
					black. Yellow, black. Yellow, black. Ooh, black and yellow! Let's shake it up a little.
					Barry! Breakfast is ready! Coming! Hang on a second. Hello? - Barry? - Adam? - Can you
					believe this is happening? - I can't. I'll pick you up. Looking sharp. Use the stairs.
					Your father paid good money for those. Sorry. I'm excited. Here's the graduate. We're very
					proud of you, son. A perfect report card, all B's. Very proud. Ma! I got a thing going
					here. - You got lint on your fuzz. - Ow! That's me! - Wave to us! We'll be in row 118,000.
					- Bye! Barry, I told you, stop flying in the house! - Hey, Adam. - Hey, Barry. - Is that
					fuzz gel? - A little. Special day, graduation. Never thought I'd make it. Three days grade
					school, three days high school. Those were awkward. Three days college. I'm glad I took a
					day and hitchhiked around the hive. You did come back different. - Hi, Barry. - Artie,
					growing a mustache? Looks good. - Hear about Frankie? - Yeah. - You going to the funeral?
					- No, I'm not going. Everybody knows, sting someone, you die. Don't waste it on a
					squirrel. Such a hothead. I guess he could have just gotten out of the way. I love this
					incorporating an amusement park into our day. That's why we don't need vacations. Boy,
					quite a bit of pomp... under the circumstances. - Well, Adam, today we are men. - We are!
					- Bee-men. - Amen! Hallelujah! Students, faculty, distinguished bees, please welcome Dean
					Buzzwell.
				</p>

				<h2 class="font-semibold text-xl text-highlighted">2. Let's Be(e) Educated:</h2>
				<UAccordion
					:items="accordionItems"
					:ui="{
						trigger: 'text-md text-highlighted',
						body: 'text-pretty',
						root: 'p-6',
					}"
				></UAccordion>

				<h2 class="font-semibold text-xl text-highlighted">3. The Masterminds:</h2>
				<UPageGrid class="p-6">
					<UPageCard
						v-for="(dev, index) in devs"
						:key="index"
						:target="dev.target"
						:to="dev.to"
						:ui="{
							container: 'border rounded-lg border-muted',
						}"
						variant="ghost"
					>
						<template #body>
							<UUser
								:avatar="dev.avatar"
								:description="dev.description"
								:name="dev.name"
								size="md"
							></UUser>
						</template>
					</UPageCard>
				</UPageGrid>
			</UPageBody>
		</UPage>
	</MainContent>
</template>
