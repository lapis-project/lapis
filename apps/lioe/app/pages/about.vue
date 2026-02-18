<script lang="ts" setup>
const members = ref([
	{
		name: "Alexandra N. Lenz",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/b/6/csm_team_lenz_2025_5264433d37.png",
			alt: "Alexandra Lenz",
		},
	},
	{
		name: "Jakob Bal",
		avatar: {
			src: "",
			alt: "Jakob Bal",
		},
	},
	{
		name: "Wolfgang Koppensteiner",
		avatar: {
			src: "",
			alt: "Wolfgang Koppensteiner",
		},
	},
	{
		name: "Kilian Kukelka",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/2/1/csm_team_kukelka_82c9a0bb19.png",
			alt: "Kilian Kukelka",
		},
	},
	{
		name: "Markus Pluschkovits",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/d/d/csm_team_pluschkovits_a90fbb9922.png",
			alt: "Markus Pluschkovits",
		},
	},
	{
		name: "Olivia Reichl",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/0/2/csm_team_reichl_42d4d05d72.png",
			alt: "Olivia Reichl",
		},
	},
	{
		name: "Marie Rohler",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/e/8/csm_team_rohler_52bd732012.png",
			alt: "Marie Rohler",
		},
	},
	{
		name: "Daniel Schopper",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/8/0/csm_team_schopper_af4a51f2a8.png",
			alt: "Daniel Schopper",
		},
	},
	{
		name: "Philipp Stöckle",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/8/c/csm_team_stoeckle_1b71b0b8b2.png",
			alt: "Philipp Stöckle",
		},
	},
	{
		name: "Katharina Wünsche",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/2/7/csm_team_wuensche_97ff68f5a4.png",
			alt: "Katharina Wünsche",
		},
	},
	{
		name: "Anja Wittibschlager",
		avatar: {
			src: "",
			alt: "Anja Wittibschlager",
		},
	},
]);
</script>

<template>
	<MainContent class="container">
		<UPage>
			<div class="mx-auto max-w-4xl pb-12">
				<UPageHeader
					description="A tribute to all who have worked on the LAPIS projects for the past years."
					title="The Team behind the Projects"
				>
				</UPageHeader>

				<UPageList>
					<UPageCard v-for="(member, index) in members" :key="index" variant="ghost">
						<template #body>
							<UUser :avatar="member.avatar" :name="member.name" size="3xl"></UUser>
						</template>
					</UPageCard>
				</UPageList>
			</div>
		</UPage>
	</MainContent>
</template>
